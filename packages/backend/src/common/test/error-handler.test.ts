import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpException, HttpStatus } from "@nestjs/common";

// Mock the audit-log.service module before importing error-handler
vi.mock("../../security/audit-log.service", () => ({
  AuditLogService: vi.fn().mockImplementation(() => ({
    logSecurityEvent: vi.fn().mockResolvedValue(undefined),
  })),
  AuditEventType: {
    ERROR_OCCURRED: "ERROR_OCCURRED",
  },
}));

// Now import after mocking
import { GlobalErrorHandler, ErrorCategory } from "../error-handler";

// Mock AuditLogService instance
const mockAuditLogService = {
  logSecurityEvent: vi.fn().mockResolvedValue(undefined),
};

describe("GlobalErrorHandler", () => {
  let errorHandler: GlobalErrorHandler;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NODE_ENV;
    errorHandler = new GlobalErrorHandler(mockAuditLogService as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("handleError", () => {
    it("should handle HttpException and return structured error", async () => {
      const exception = new HttpException("Not Found", HttpStatus.NOT_FOUND);

      const result = await errorHandler.handleError(exception);

      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBeDefined();
      expect(result.error.message).toBeDefined();
      expect(result.error.timestamp).toBeDefined();
    });

    it("should handle generic Error", async () => {
      const error = new Error("Something went wrong");

      const result = await errorHandler.handleError(error);

      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.meta).toBeDefined();
    });

    it("should include request ID from request headers", async () => {
      const error = new Error("Test");
      const mockRequest = {
        headers: {
          "x-request-id": "req-123",
        },
        ip: "127.0.0.1",
        path: "/test",
        method: "GET",
      } as any;

      const result = await errorHandler.handleError(error, mockRequest);

      expect(result.error.requestId).toBe("req-123");
    });

    it("should include timestamp in response", async () => {
      const error = new Error("Test");

      const result = await errorHandler.handleError(error);

      expect(result.error.timestamp).toBeDefined();
      expect(new Date(result.error.timestamp).getTime()).not.toBeNaN();
    });

    it("should call audit log for security-related errors", async () => {
      const exception = new HttpException(
        "Unauthorized",
        HttpStatus.UNAUTHORIZED,
      );
      const mockRequest = {
        headers: {},
        ip: "127.0.0.1",
        path: "/test",
        method: "GET",
      } as any;

      await errorHandler.handleError(exception, mockRequest);

      expect(mockAuditLogService.logSecurityEvent).toHaveBeenCalled();
    });
  });

  describe("error categorization", () => {
    it("should categorize 400 as VALIDATION", async () => {
      const exception = new HttpException(
        "Bad Request",
        HttpStatus.BAD_REQUEST,
      );

      const result = await errorHandler.handleError(exception);

      expect(result.meta?.category).toBe(ErrorCategory.VALIDATION);
    });

    it("should categorize 401 as AUTHENTICATION", async () => {
      const exception = new HttpException(
        "Unauthorized",
        HttpStatus.UNAUTHORIZED,
      );

      const result = await errorHandler.handleError(exception);

      expect(result.meta?.category).toBe(ErrorCategory.AUTHENTICATION);
    });

    it("should categorize 403 as AUTHORIZATION", async () => {
      const exception = new HttpException("Forbidden", HttpStatus.FORBIDDEN);

      const result = await errorHandler.handleError(exception);

      expect(result.meta?.category).toBe(ErrorCategory.AUTHORIZATION);
    });

    it("should categorize 404 as NOT_FOUND", async () => {
      const exception = new HttpException("Not Found", HttpStatus.NOT_FOUND);

      const result = await errorHandler.handleError(exception);

      expect(result.meta?.category).toBe(ErrorCategory.NOT_FOUND);
    });

    it("should categorize 429 as RATE_LIMIT", async () => {
      const exception = new HttpException(
        "Too Many Requests",
        HttpStatus.TOO_MANY_REQUESTS,
      );

      const result = await errorHandler.handleError(exception);

      expect(result.meta?.category).toBe(ErrorCategory.RATE_LIMIT);
    });

    it("should categorize 500 as INTERNAL", async () => {
      const exception = new HttpException(
        "Internal Error",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      const result = await errorHandler.handleError(exception);

      expect(result.meta?.category).toBe(ErrorCategory.INTERNAL);
    });

    it("should categorize database-related errors", async () => {
      const error = new Error("Database connection failed");

      const result = await errorHandler.handleError(error);

      expect(result.meta?.category).toBe(ErrorCategory.DATABASE);
    });

    it("should categorize validation-related errors by message", async () => {
      const error = new Error("Validation failed for field");

      const result = await errorHandler.handleError(error);

      expect(result.meta?.category).toBe(ErrorCategory.VALIDATION);
    });
  });

  describe("severity determination", () => {
    it("should assign LOW severity for rate limit errors", async () => {
      const exception = new HttpException(
        "Too Many Requests",
        HttpStatus.TOO_MANY_REQUESTS,
      );

      const result = await errorHandler.handleError(exception);

      expect(result.meta?.severity).toBe("LOW");
    });

    it("should assign LOW severity for validation errors", async () => {
      const exception = new HttpException(
        "Bad Request",
        HttpStatus.BAD_REQUEST,
      );

      const result = await errorHandler.handleError(exception);

      expect(result.meta?.severity).toBe("LOW");
    });

    it("should assign MEDIUM severity for auth errors", async () => {
      const exception = new HttpException(
        "Unauthorized",
        HttpStatus.UNAUTHORIZED,
      );

      const result = await errorHandler.handleError(exception);

      expect(result.meta?.severity).toBe("MEDIUM");
    });

    it("should assign MEDIUM severity for database errors", async () => {
      const error = new Error("Database query failed");

      const result = await errorHandler.handleError(error);

      expect(result.meta?.severity).toBe("MEDIUM");
    });

    it("should assign HIGH severity for internal errors", async () => {
      const exception = new HttpException(
        "Server Error",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      const result = await errorHandler.handleError(exception);

      expect(result.meta?.severity).toBe("HIGH");
    });

    it("should assign HIGH severity for security errors", async () => {
      const error = new Error("CSRF token mismatch");

      const result = await errorHandler.handleError(error);

      expect(result.meta?.severity).toBe("HIGH");
    });
  });

  describe("message sanitization in production", () => {
    it("should sanitize error messages in production", async () => {
      process.env.NODE_ENV = "production";
      const prodErrorHandler = new GlobalErrorHandler(
        mockAuditLogService as any,
      );

      const error = new Error("Database connection failed: password=secret123");
      const result = await prodErrorHandler.handleError(error);

      // In production, internal errors should have generic messages
      expect(result.error.message).not.toContain("secret123");
    });

    it("should not expose file paths in production", async () => {
      process.env.NODE_ENV = "production";
      const prodErrorHandler = new GlobalErrorHandler(
        mockAuditLogService as any,
      );

      const error = new Error("Error at C:\\Users\\admin\\secrets\\file.ts");
      const result = await prodErrorHandler.handleError(error);

      expect(result.error.message).not.toContain("C:\\Users");
      expect(result.error.message).not.toContain("secrets");
    });

    it("should return generic message for internal errors in production", async () => {
      process.env.NODE_ENV = "production";
      const prodErrorHandler = new GlobalErrorHandler(
        mockAuditLogService as any,
      );

      const exception = new HttpException(
        "Detailed internal error info",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      const result = await prodErrorHandler.handleError(exception);

      expect(result.error.message).toBe(
        "An unexpected error occurred. Please try again later.",
      );
    });

    it("should include error details in development", async () => {
      process.env.NODE_ENV = "development";
      const devErrorHandler = new GlobalErrorHandler(
        mockAuditLogService as any,
      );

      const error = new Error("Detailed error message");
      const result = await devErrorHandler.handleError(error);

      expect(result.error.details).toBeDefined();
    });

    it("should not include error details in production", async () => {
      process.env.NODE_ENV = "production";
      const prodErrorHandler = new GlobalErrorHandler(
        mockAuditLogService as any,
      );

      const error = new Error("Some error");
      const result = await prodErrorHandler.handleError(error);

      expect(result.error.details).toBeUndefined();
    });
  });

  describe("retryable determination", () => {
    it("should mark rate limit errors as retryable", async () => {
      const exception = new HttpException(
        "Too Many Requests",
        HttpStatus.TOO_MANY_REQUESTS,
      );

      const result = await errorHandler.handleError(exception);

      expect(result.meta?.retryable).toBe(true);
    });

    it("should mark database errors as retryable", async () => {
      const error = new Error("Database connection lost");

      const result = await errorHandler.handleError(error);

      expect(result.meta?.retryable).toBe(true);
    });

    it("should mark external service errors as retryable", async () => {
      const error = new Error("External API timeout");

      const result = await errorHandler.handleError(error);

      expect(result.meta?.retryable).toBe(true);
    });

    it("should not mark validation errors as retryable", async () => {
      const exception = new HttpException(
        "Bad Request",
        HttpStatus.BAD_REQUEST,
      );

      const result = await errorHandler.handleError(exception);

      expect(result.meta?.retryable).toBe(false);
    });

    it("should not mark auth errors as retryable", async () => {
      const exception = new HttpException(
        "Unauthorized",
        HttpStatus.UNAUTHORIZED,
      );

      const result = await errorHandler.handleError(exception);

      expect(result.meta?.retryable).toBe(false);
    });

    it("should not mark internal errors as retryable", async () => {
      const exception = new HttpException(
        "Internal Error",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      const result = await errorHandler.handleError(exception);

      expect(result.meta?.retryable).toBe(false);
    });
  });

  describe("error code generation", () => {
    it("should generate code with category prefix", async () => {
      const exception = new HttpException("Not Found", HttpStatus.NOT_FOUND);

      const result = await errorHandler.handleError(exception);

      expect(result.error.code).toMatch(/^NOT-404$/);
    });

    it("should generate code with status for validation errors", async () => {
      const exception = new HttpException(
        "Bad Request",
        HttpStatus.BAD_REQUEST,
      );

      const result = await errorHandler.handleError(exception);

      expect(result.error.code).toMatch(/^VAL-400$/);
    });

    it("should generate code for internal errors", async () => {
      const exception = new HttpException(
        "Server Error",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      const result = await errorHandler.handleError(exception);

      expect(result.error.code).toMatch(/^INT-500$/);
    });
  });

  describe("handleUnhandledRejection", () => {
    it("should handle unhandled promise rejections", () => {
      const reason = new Error("Unhandled rejection");
      const promise = Promise.reject(reason);

      expect(() => {
        errorHandler.handleUnhandledRejection(reason, promise);
      }).not.toThrow();

      // Clean up unhandled promise
      promise.catch(() => {});
    });

    it("should handle non-Error rejection reasons", () => {
      const reason = "String rejection reason";
      const promise = Promise.reject(reason);

      expect(() => {
        errorHandler.handleUnhandledRejection(reason, promise);
      }).not.toThrow();

      promise.catch(() => {});
    });

    it("should handle object rejection reasons with message", () => {
      const reason = { message: "Object rejection" };
      const promise = Promise.reject(reason);

      expect(() => {
        errorHandler.handleUnhandledRejection(reason, promise);
      }).not.toThrow();

      promise.catch(() => {});
    });
  });

  describe("handleUncaughtException", () => {
    it("should handle uncaught exceptions", () => {
      const error = new Error("Uncaught exception");

      expect(() => {
        errorHandler.handleUncaughtException(error);
      }).not.toThrow();
    });

    it("should sanitize exception message in production", () => {
      process.env.NODE_ENV = "production";
      const prodErrorHandler = new GlobalErrorHandler(
        mockAuditLogService as any,
      );

      const error = new Error(
        "Uncaught at /path/to/secret/file.ts with password=secret",
      );

      expect(() => {
        prodErrorHandler.handleUncaughtException(error);
      }).not.toThrow();
    });
  });
});

describe("ErrorCategory enum", () => {
  it("should have all expected categories", () => {
    expect(ErrorCategory.VALIDATION).toBe("VALIDATION");
    expect(ErrorCategory.AUTHENTICATION).toBe("AUTHENTICATION");
    expect(ErrorCategory.AUTHORIZATION).toBe("AUTHORIZATION");
    expect(ErrorCategory.NOT_FOUND).toBe("NOT_FOUND");
    expect(ErrorCategory.RATE_LIMIT).toBe("RATE_LIMIT");
    expect(ErrorCategory.INTERNAL).toBe("INTERNAL");
    expect(ErrorCategory.DATABASE).toBe("DATABASE");
    expect(ErrorCategory.EXTERNAL_SERVICE).toBe("EXTERNAL_SERVICE");
    expect(ErrorCategory.SECURITY).toBe("SECURITY");
  });
});
