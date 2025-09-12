import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GlobalErrorHandler } from "../error-handler";
import { AuditLogService } from "../../security/audit-log.service";

// Mock AuditLogService
const mockAuditLogService = {
  logSecurityEvent: vi.fn(),
} as unknown as AuditLogService;

describe("Error Sanitization", () => {
  let errorHandler: GlobalErrorHandler;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    errorHandler = new GlobalErrorHandler(mockAuditLogService);
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe("sanitizeErrorMessage", () => {
    it("should sanitize file paths", () => {
      process.env.NODE_ENV = "production";

      const error = new Error("File not found: C:\\Users\\admin\\secret.txt");
      const result = errorHandler["sanitizeErrorMessage"](error.message);

      expect(result).toBe("File not found: [PATH]");
    });

    it("should sanitize IP addresses", () => {
      process.env.NODE_ENV = "production";

      const error = new Error("Connection failed to 192.168.1.100");
      const result = errorHandler["sanitizeErrorMessage"](error.message);

      expect(result).toBe("Connection failed to [IP]");
    });

    it("should sanitize email addresses", () => {
      process.env.NODE_ENV = "production";

      const error = new Error("Failed to send email to admin@company.com");
      const result = errorHandler["sanitizeErrorMessage"](error.message);

      expect(result).toBe("Failed to send email to [EMAIL]");
    });

    it("should sanitize potential tokens", () => {
      process.env.NODE_ENV = "production";

      const error = new Error(
        "Invalid token: abc123def456ghi789jkl012mno345pqr678",
      );
      const result = errorHandler["sanitizeErrorMessage"](error.message);

      expect(result).toBe("Invalid token: [TOKEN]");
    });

    it("should sanitize SQL queries", () => {
      process.env.NODE_ENV = "production";

      const error = new Error(
        "SQL Error: SELECT * FROM users WHERE password = 'secret'",
      );
      const result = errorHandler["sanitizeErrorMessage"](error.message);

      expect(result).toBe("SQL Error: [SQL_QUERY]");
    });

    it("should sanitize localhost references", () => {
      process.env.NODE_ENV = "production";

      const error = new Error("Connection failed to localhost:3000");
      const result = errorHandler["sanitizeErrorMessage"](error.message);

      expect(result).toBe("Connection failed to [HOST]:3000");
    });

    it("should truncate very long messages", () => {
      process.env.NODE_ENV = "production";

      const longMessage = "A".repeat(300);
      const error = new Error(longMessage);
      const result = errorHandler["sanitizeErrorMessage"](error.message);

      expect(result).toHaveLength(200);
      expect(result.endsWith("...")).toBe(true);
    });
  });

  describe("sanitizeValidationMessage", () => {
    it("should allow safe validation patterns", () => {
      process.env.NODE_ENV = "production";

      const safeMessages = [
        "email must be a valid email",
        "password must be at least 8 characters",
        "name is required",
        "age must be a number",
      ];

      safeMessages.forEach((message) => {
        const result = errorHandler["sanitizeValidationMessage"](message);
        expect(result).toBe(message);
      });
    });

    it("should sanitize unsafe validation messages", () => {
      process.env.NODE_ENV = "production";

      const unsafeMessage =
        "Database constraint violation in table admin_users";
      const result = errorHandler["sanitizeValidationMessage"](unsafeMessage);

      expect(result).toBe("Invalid input provided.");
    });
  });

  describe("sanitizeIpAddress", () => {
    it("should sanitize IPv4 addresses", () => {
      const result = errorHandler["sanitizeIpAddress"]("192.168.1.100");
      expect(result).toBe("192.168.xxx.xxx");
    });

    it("should sanitize IPv6 addresses", () => {
      const result = errorHandler["sanitizeIpAddress"](
        "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      );
      expect(result).toBe("2001:0db8:xxxx:xxxx:xxxx:xxxx");
    });

    it("should handle malformed IP addresses", () => {
      const result = errorHandler["sanitizeIpAddress"]("invalid-ip");
      expect(result).toBe("[IP]");
    });
  });

  describe("Production vs Development", () => {
    it("should return sanitized messages in production", () => {
      process.env.NODE_ENV = "production";

      const error = new Error("Database connection failed to localhost:5432");
      const context = {
        category: "DATABASE" as any,
        severity: "HIGH" as any,
        timestamp: new Date(),
        requestId: "test-id",
      };

      const result = errorHandler["getUserFriendlyMessage"](error, context);
      expect(result).toBe("A database error occurred. Please try again.");
    });

    it("should return detailed messages in development", () => {
      process.env.NODE_ENV = "development";

      const error = new Error("Database connection failed to localhost:5432");
      const context = {
        category: "DATABASE" as any,
        severity: "HIGH" as any,
        timestamp: new Date(),
        requestId: "test-id",
      };

      const result = errorHandler["getUserFriendlyMessage"](error, context);
      expect(result).toBe("Database connection failed to [HOST]:5432");
    });

    it("should always sanitize security errors", () => {
      process.env.NODE_ENV = "development";

      const error = new Error(
        "Authentication failed for user admin@company.com",
      );
      const context = {
        category: "SECURITY" as any,
        severity: "HIGH" as any,
        timestamp: new Date(),
        requestId: "test-id",
      };

      const result = errorHandler["getUserFriendlyMessage"](error, context);
      expect(result).toBe("Access denied.");
    });
  });
});
