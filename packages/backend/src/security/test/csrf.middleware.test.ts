import { describe, it, expect, beforeEach, vi } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { CSRFMiddleware } from "../csrf.middleware";
import type { Request, Response, NextFunction } from "express";

describe("CSRFMiddleware", () => {
  let middleware: CSRFMiddleware;
  let mockCSRFTokenService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockCSRFTokenService = {
      getSessionId: vi.fn(),
      extractTokenFromRequest: vi.fn(),
      validateToken: vi.fn(),
    };

    mockRequest = {
      method: "POST",
      path: "/auth/login",
      headers: {},
    };

    mockResponse = {};

    mockNext = vi.fn();

    middleware = new CSRFMiddleware(mockCSRFTokenService);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe("use", () => {
    it("should skip CSRF validation for safe methods", async () => {
      const safeMethods = ["GET", "HEAD", "OPTIONS"];

      for (const method of safeMethods) {
        mockRequest.method = method;

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
        expect(mockCSRFTokenService.getSessionId).not.toHaveBeenCalled();

        // Reset for next iteration
        vi.clearAllMocks();
      }
    });

    it("should skip CSRF validation for excluded paths", async () => {
      const excludedPaths = [
        "/health",
        "/healthz",
        "/ping",
        "/api/health",
        "/trpc/health",
        "/health/check", // Should match /health prefix
        "/api/health/status", // Should match /api/health prefix
      ];

      for (const path of excludedPaths) {
        mockRequest.url = path;
        mockRequest.method = "POST";

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
        expect(mockCSRFTokenService.getSessionId).not.toHaveBeenCalled();

        // Reset for next iteration
        vi.clearAllMocks();
      }
    });

    it("should skip CSRF validation for API routes with valid JWT", async () => {
      mockRequest.url = "/api/users";
      mockRequest.method = "POST";
      mockRequest.headers = {
        authorization: "Bearer valid-jwt-token",
      };

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockCSRFTokenService.getSessionId).not.toHaveBeenCalled();
    });

    it("should skip CSRF validation for tRPC routes with valid JWT", async () => {
      mockRequest.url = "/trpc/users.create";
      mockRequest.method = "POST";
      mockRequest.headers = {
        authorization: "Bearer valid-jwt-token",
      };

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockCSRFTokenService.getSessionId).not.toHaveBeenCalled();
    });

    it("should validate CSRF token for state-changing requests", async () => {
      mockRequest.url = "/auth/login";
      mockRequest.method = "POST";
      mockRequest.headers = {};

      mockCSRFTokenService.getSessionId.mockReturnValue("session-123");
      mockCSRFTokenService.extractTokenFromRequest.mockReturnValue(
        "csrf-token",
      );
      mockCSRFTokenService.validateToken.mockResolvedValue({ isValid: true });

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockCSRFTokenService.getSessionId).toHaveBeenCalledWith(
        mockRequest,
      );
      expect(mockCSRFTokenService.extractTokenFromRequest).toHaveBeenCalledWith(
        mockRequest,
      );
      expect(mockCSRFTokenService.validateToken).toHaveBeenCalledWith(
        "session-123",
        "csrf-token",
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it("should throw ForbiddenException when CSRF token is missing", async () => {
      mockRequest.url = "/auth/login";
      mockRequest.method = "POST";
      mockRequest.headers = {};

      mockCSRFTokenService.getSessionId.mockReturnValue("session-123");
      mockCSRFTokenService.extractTokenFromRequest.mockReturnValue(null);

      await expect(
        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException when CSRF token validation fails", async () => {
      mockRequest.url = "/auth/login";
      mockRequest.method = "POST";
      mockRequest.headers = {};

      mockCSRFTokenService.getSessionId.mockReturnValue("session-123");
      mockCSRFTokenService.extractTokenFromRequest.mockReturnValue(
        "invalid-token",
      );
      mockCSRFTokenService.validateToken.mockResolvedValue({
        isValid: false,
        error: "Token expired",
      });

      await expect(
        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle validation service errors", async () => {
      mockRequest.url = "/auth/login";
      mockRequest.method = "POST";
      mockRequest.headers = {};

      mockCSRFTokenService.getSessionId.mockReturnValue("session-123");
      mockCSRFTokenService.extractTokenFromRequest.mockReturnValue(
        "csrf-token",
      );
      mockCSRFTokenService.validateToken.mockRejectedValue(
        new Error("Service error"),
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(
        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(consoleSpy).toHaveBeenCalledWith(
        "CSRF middleware error:",
        expect.any(Error),
      );
      expect(mockNext).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("isExcludedPath", () => {
    it("should return true for excluded paths", () => {
      const excludedPaths = [
        "/health",
        "/healthz",
        "/ping",
        "/api/health",
        "/trpc/health",
      ];

      excludedPaths.forEach((path) => {
        expect(middleware["isExcludedPath"](path)).toBe(true);
      });
    });

    it("should return true for paths starting with excluded paths", () => {
      expect(middleware["isExcludedPath"]("/health/check")).toBe(true);
      expect(middleware["isExcludedPath"]("/api/health/status")).toBe(true);
      expect(middleware["isExcludedPath"]("/ping/test")).toBe(true);
    });

    it("should return false for non-excluded paths", () => {
      const nonExcludedPaths = [
        "/auth/login",
        "/admin/dashboard",
        "/api/users",
        "/trpc/users.create",
        "/public/assets",
      ];

      nonExcludedPaths.forEach((path) => {
        expect(middleware["isExcludedPath"](path)).toBe(false);
      });
    });
  });

  describe("isAPIRoute", () => {
    it("should return true for API routes", () => {
      const apiRoutes = [
        "/api/users",
        "/api/auth/login",
        "/api/v1/posts",
        "/trpc/users.create",
        "/trpc/auth.login",
      ];

      apiRoutes.forEach((route) => {
        expect(middleware["isAPIRoute"](route)).toBe(true);
      });
    });

    it("should return false for non-API routes", () => {
      const nonApiRoutes = [
        "/auth/login",
        "/admin/dashboard",
        "/public/assets",
        "/health",
        "/favicon.ico",
      ];

      nonApiRoutes.forEach((route) => {
        expect(middleware["isAPIRoute"](route)).toBe(false);
      });
    });
  });

  describe("hasValidJWT", () => {
    it("should return true for valid Bearer token", () => {
      const requestWithJWT = {
        headers: {
          authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        },
      } as Request;

      expect(middleware["hasValidJWT"](requestWithJWT)).toBe(true);
    });

    it("should return false for missing authorization header", () => {
      const requestWithoutAuth = {
        headers: {},
      } as Request;

      expect(middleware["hasValidJWT"](requestWithoutAuth)).toBeFalsy();
    });

    it("should return false for non-Bearer authorization", () => {
      const requestWithBasicAuth = {
        headers: {
          authorization: "Basic dXNlcjpwYXNzd29yZA==",
        },
      } as Request;

      expect(middleware["hasValidJWT"](requestWithBasicAuth)).toBe(false);
    });

    it("should return false for malformed Bearer token", () => {
      const requestWithMalformedBearer = {
        headers: {
          authorization: "Bearer",
        },
      } as Request;

      expect(middleware["hasValidJWT"](requestWithMalformedBearer)).toBe(false); // "Bearer" doesn't start with "Bearer "
    });

    it("should return false for empty authorization header", () => {
      const requestWithEmptyAuth = {
        headers: {
          authorization: "",
        },
      } as Request;

      expect(middleware["hasValidJWT"](requestWithEmptyAuth)).toBeFalsy();
    });
  });

  describe("validateCSRFToken", () => {
    it("should validate CSRF token successfully", async () => {
      mockCSRFTokenService.getSessionId.mockReturnValue("session-123");
      mockCSRFTokenService.extractTokenFromRequest.mockReturnValue(
        "valid-csrf-token",
      );
      mockCSRFTokenService.validateToken.mockResolvedValue({ isValid: true });

      await middleware["validateCSRFToken"](
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockCSRFTokenService.getSessionId).toHaveBeenCalledWith(
        mockRequest,
      );
      expect(mockCSRFTokenService.extractTokenFromRequest).toHaveBeenCalledWith(
        mockRequest,
      );
      expect(mockCSRFTokenService.validateToken).toHaveBeenCalledWith(
        "session-123",
        "valid-csrf-token",
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it("should throw ForbiddenException for missing token", async () => {
      mockCSRFTokenService.getSessionId.mockReturnValue("session-123");
      mockCSRFTokenService.extractTokenFromRequest.mockReturnValue(null);

      await expect(
        middleware["validateCSRFToken"](
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        ),
      ).rejects.toThrow(new ForbiddenException("CSRF token is required"));

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException for invalid token", async () => {
      mockCSRFTokenService.getSessionId.mockReturnValue("session-123");
      mockCSRFTokenService.extractTokenFromRequest.mockReturnValue(
        "invalid-token",
      );
      mockCSRFTokenService.validateToken.mockResolvedValue({
        isValid: false,
        error: "Token has expired",
      });

      await expect(
        middleware["validateCSRFToken"](
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        ),
      ).rejects.toThrow(
        new ForbiddenException("CSRF validation failed: Token has expired"),
      );

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should re-throw ForbiddenException from validation", async () => {
      mockCSRFTokenService.getSessionId.mockReturnValue("session-123");
      mockCSRFTokenService.extractTokenFromRequest.mockReturnValue("token");
      mockCSRFTokenService.validateToken.mockRejectedValue(
        new ForbiddenException("Custom CSRF error"),
      );

      await expect(
        middleware["validateCSRFToken"](
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        ),
      ).rejects.toThrow(new ForbiddenException("Custom CSRF error"));

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors gracefully", async () => {
      mockCSRFTokenService.getSessionId.mockReturnValue("session-123");
      mockCSRFTokenService.extractTokenFromRequest.mockReturnValue("token");
      mockCSRFTokenService.validateToken.mockRejectedValue(
        new Error("Unexpected error"),
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(
        middleware["validateCSRFToken"](
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        ),
      ).rejects.toThrow(new ForbiddenException("CSRF validation failed"));

      expect(consoleSpy).toHaveBeenCalledWith(
        "CSRF middleware error:",
        expect.any(Error),
      );
      expect(mockNext).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete flow for protected route", async () => {
      mockRequest = {
        method: "POST",
        path: "/auth/login",
        headers: {},
      };

      mockCSRFTokenService.getSessionId.mockReturnValue("session-123");
      mockCSRFTokenService.extractTokenFromRequest.mockReturnValue(
        "valid-token",
      );
      mockCSRFTokenService.validateToken.mockResolvedValue({ isValid: true });

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle complete flow for API route with JWT", async () => {
      mockRequest = {
        method: "POST",
        path: "/api/users",
        headers: {
          authorization: "Bearer valid-jwt-token",
        },
      };

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockCSRFTokenService.getSessionId).not.toHaveBeenCalled();
    });

    it("should handle complete flow for safe method", async () => {
      mockRequest = {
        method: "GET",
        path: "/auth/login",
        headers: {},
      };

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockCSRFTokenService.getSessionId).not.toHaveBeenCalled();
    });
  });
});
