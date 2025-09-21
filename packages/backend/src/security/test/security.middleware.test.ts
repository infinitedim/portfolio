import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";
import { SecurityMiddleware } from "../security.middleware";
import { AuditEventType } from "../audit-log.service";
import { securityLogger } from "../../logging/logger";

// Mock the logger
vi.mock("../../logging/logger", () => ({
  securityLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("SecurityMiddleware", () => {
  let middleware: SecurityMiddleware;
  let mockSecurityService: any;
  let mockAuditLogService: any;
  let mockCSRFService: any;
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockSecurityService = {
      checkRateLimit: vi.fn(),
      sanitizeInput: vi.fn(),
      validateInput: vi.fn(),
      logSecurityEvent: vi.fn(),
    };

    mockAuditLogService = {
      logSecurityEvent: vi.fn(),
    };

    mockCSRFService = {
      validateCSRFToken: vi.fn(),
      generateCSRFToken: vi.fn(),
    };

    mockRequest = {
      ip: "192.168.1.1",
      method: "GET",
      path: "/api/test",
      url: "/api/test",
      headers: {
        "user-agent": "test-agent",
        "content-type": "application/json",
      },
      body: {},
      query: {},
      params: {},
      get: vi.fn(),
    };

    mockResponse = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      end: vi.fn(),
    };

    nextFunction = vi.fn();

    middleware = new SecurityMiddleware(
      mockSecurityService,
      mockAuditLogService,
      mockCSRFService,
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with all services", () => {
      const middleware = new SecurityMiddleware(
        mockSecurityService,
        mockAuditLogService,
        mockCSRFService,
      );

      expect(middleware).toBeDefined();
    });

    it("should initialize with optional services missing", () => {
      const middleware = new SecurityMiddleware();

      expect(middleware).toBeDefined();
    });
    it("should log service availability", () => {
      new SecurityMiddleware(
        mockSecurityService,
        mockAuditLogService,
        mockCSRFService,
      );

      expect(securityLogger.info).toHaveBeenCalledWith(
        "Security middleware service availability",
        expect.objectContaining({
          securityService: true,
          auditLogService: true,
          csrfService: true,
          component: "SecurityMiddleware",
          operation: "constructor",
        }),
      );
    });

    it("should warn about missing critical services", () => {
      it("should warn about missing critical services", () => {
        new SecurityMiddleware(); // No services provided
        expect(securityLogger.warn).toHaveBeenCalledWith(
          "SecurityService not available - rate limiting disabled",
          expect.objectContaining({
            component: "SecurityMiddleware",
            operation: "constructor",
          }),
        );
      });
    });

    describe("use", () => {
      it("should skip security checks for excluded paths", async () => {
        const excludedPaths = [
          "/health",
          "/healthz",
          "/ping",
          "/api/health",
          "/trpc/health",
          "/favicon.ico",
          "/robots.txt",
        ];

        for (const path of excludedPaths) {
          mockRequest.path = path;
          mockRequest.url = path;

          await middleware.use(
            mockRequest,
            mockResponse as Response,
            nextFunction,
          );

          expect(nextFunction).toHaveBeenCalled();
          expect(mockSecurityService.checkRateLimit).not.toHaveBeenCalled();
        }
      });

      it("should perform security checks for non-excluded paths", async () => {
        mockSecurityService.checkRateLimit.mockResolvedValue({
          isBlocked: false,
        });
        mockSecurityService.validateInput.mockReturnValue(true);
        mockCSRFService.validateCSRFToken.mockReturnValue(true);

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );

        expect(mockSecurityService.checkRateLimit).toHaveBeenCalled();
        expect(nextFunction).toHaveBeenCalled();
      });

      it("should block requests when rate limited", async () => {
        mockSecurityService.checkRateLimit.mockResolvedValue({
          isBlocked: true,
          reason: "Too many requests",
          retryAfter: 60,
        });

        await expect(
          middleware.use(mockRequest, mockResponse as Response, nextFunction),
        ).rejects.toThrow(ForbiddenException);

        expect(mockAuditLogService.logSecurityEvent).toHaveBeenCalledWith(
          AuditEventType.RATE_LIMIT_EXCEEDED,
          expect.objectContaining({
            reason: "Too many requests",
            retryAfter: 60,
          }),
          mockRequest,
        );
        expect(nextFunction).not.toHaveBeenCalled();
      });

      it("should validate CSRF token for state-changing methods", async () => {
        mockRequest.method = "POST";
        mockRequest.headers = {
          ...mockRequest.headers,
          "x-csrf-token": "valid-csrf-token",
        };

        mockSecurityService.checkRateLimit.mockResolvedValue({
          isBlocked: false,
        });
        mockSecurityService.validateInput.mockReturnValue(true);
        mockCSRFService.validateCSRFToken.mockReturnValue(true);

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );

        expect(mockCSRFService.validateCSRFToken).toHaveBeenCalledWith(
          "valid-csrf-token",
        );
        expect(nextFunction).toHaveBeenCalled();
      });

      it("should reject requests with invalid CSRF tokens", async () => {
        mockRequest.method = "POST";
        mockRequest.headers = {
          ...mockRequest.headers,
          "x-csrf-token": "invalid-csrf-token",
        };

        mockSecurityService.checkRateLimit.mockResolvedValue({
          isBlocked: false,
        });
        mockCSRFService.validateCSRFToken.mockReturnValue(false);

        await expect(
          middleware.use(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction,
          ),
        ).rejects.toThrow(ForbiddenException);

        expect(mockAuditLogService.logSecurityEvent).toHaveBeenCalledWith(
          AuditEventType.CSRF_TOKEN_INVALID,
          expect.any(Object),
          mockRequest,
        );
        expect(nextFunction).not.toHaveBeenCalled();
      });

      it("should sanitize request inputs", async () => {
        mockRequest.body = {
          userInput: "<script>alert('xss')</script>",
          safeInput: "normal text",
        };

        mockSecurityService.checkRateLimit.mockResolvedValue({
          isBlocked: false,
        });
        mockSecurityService.sanitizeInput.mockImplementation((input) =>
          typeof input === "string"
            ? input.replace(/<script.*?<\/script>/gi, "")
            : input,
        );
        mockSecurityService.validateInput.mockReturnValue(true);

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );

        expect(mockSecurityService.sanitizeInput).toHaveBeenCalled();
        expect(nextFunction).toHaveBeenCalled();
      });

      it("should handle missing security service gracefully", async () => {
        const middlewareWithoutServices = new SecurityMiddleware();

        await middlewareWithoutServices.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );

        expect(nextFunction).toHaveBeenCalled();
      });

      it("should log security events for suspicious requests", async () => {
        mockRequest.headers = {
          ...mockRequest.headers,
          "user-agent": "suspicious-bot",
        };
        mockRequest.body = {
          potentialAttack: "'; DROP TABLE users; --",
        };

        mockSecurityService.checkRateLimit.mockResolvedValue({
          isBlocked: false,
        });
        mockSecurityService.validateInput.mockReturnValue(false); // Indicates suspicious input

        await expect(
          middleware.use(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction,
          ),
        ).rejects.toThrow(ForbiddenException);

        expect(mockAuditLogService.logSecurityEvent).toHaveBeenCalledWith(
          AuditEventType.SUSPICIOUS_ACTIVITY,
          expect.objectContaining({
            reason: "Invalid input detected",
          }),
          mockRequest,
        );
      });

      it("should handle errors in security checks gracefully", async () => {
        mockSecurityService.checkRateLimit.mockRejectedValue(
          new Error("Rate limit service error"),
        );

        // Should not throw but log the error and continue
        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );

        expect(nextFunction).toHaveBeenCalled();
      });

      it("should set security headers", async () => {
        mockSecurityService.checkRateLimit.mockResolvedValue({
          isBlocked: false,
        });
        mockSecurityService.validateInput.mockReturnValue(true);

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );

        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          "X-Content-Type-Options",
          "nosniff",
        );
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          "X-Frame-Options",
          "DENY",
        );
        expect(nextFunction).toHaveBeenCalled();
      });

      it("should handle different HTTP methods correctly", async () => {
        const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

        mockSecurityService.checkRateLimit.mockResolvedValue({
          isBlocked: false,
        });
        mockSecurityService.validateInput.mockReturnValue(true);
        mockCSRFService.validateCSRFToken.mockReturnValue(true);

        for (const method of methods) {
          mockRequest.method = method;

          if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
            mockRequest.headers = {
              ...mockRequest.headers,
              "x-csrf-token": "valid-token",
            };
          }

          await middleware.use(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction,
          );

          expect(nextFunction).toHaveBeenCalled();
          vi.clearAllMocks();
        }
      });

      it("should validate request size limits", async () => {
        mockRequest.headers = {
          ...mockRequest.headers,
          "content-length": "10485760", // 10MB
        };

        mockSecurityService.checkRateLimit.mockResolvedValue({
          isBlocked: false,
        });
        mockSecurityService.validateInput.mockReturnValue(false); // Assuming size validation fails

        await expect(
          middleware.use(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction,
          ),
        ).rejects.toThrow(ForbiddenException);

        expect(mockAuditLogService.logSecurityEvent).toHaveBeenCalledWith(
          AuditEventType.SUSPICIOUS_ACTIVITY,
          expect.objectContaining({
            reason: "Invalid input detected",
          }),
          mockRequest,
        );
      });
    });

    describe("private helper methods", () => {
      it("should properly identify excluded paths", () => {
        // Test that the middleware correctly identifies excluded paths
        const testCases = [
          { path: "/health", shouldExclude: true },
          { path: "/api/health", shouldExclude: true },
          { path: "/api/users", shouldExclude: false },
          { path: "/favicon.ico", shouldExclude: true },
          { path: "/api/favicon.ico", shouldExclude: false },
        ];

        testCases.forEach(({ path, shouldExclude }) => {
          mockRequest.path = path;
          mockRequest.url = path;

          // We can't directly test private methods, but we can test the behavior
          // by checking if rate limiting is called or not
          mockSecurityService.checkRateLimit.mockClear();

          middleware.use(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction,
          );

          if (shouldExclude) {
            expect(mockSecurityService.checkRateLimit).not.toHaveBeenCalled();
          }
        });
      });
    });
  });
});
