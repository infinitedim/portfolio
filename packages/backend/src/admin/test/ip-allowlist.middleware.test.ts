import { describe, it, expect, beforeEach, vi } from "vitest";
import { IpAllowlistMiddleware } from "../ip-allowlist.middleware";
import { ForbiddenException } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";

// Mock AllowedIpService
const mockAllowedIpService = {
  isIpAllowed: vi.fn(),
};

describe("IpAllowlistMiddleware", () => {
  let middleware: IpAllowlistMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Create middleware instance directly with mocked dependencies
    middleware = new IpAllowlistMiddleware(mockAllowedIpService as any);

    // Setup mock request, response, and next function
    mockRequest = {
      path: "/admin/profile",
      headers: {},
      connection: {
        remoteAddress: "192.168.1.1",
      } as any,
      socket: {
        remoteAddress: "192.168.1.1",
      } as any,
    } as any;
    mockResponse = {};
    mockNext = vi.fn();

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe("use", () => {
    it("should allow access for non-admin routes", async () => {
      const request = { ...mockRequest, path: "/api/public" } as Request;

      await middleware.use(request, mockResponse as Response, mockNext);

      expect(mockAllowedIpService.isIpAllowed).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should allow access for login routes", async () => {
      const request = { ...mockRequest, path: "/admin/login" } as Request;

      await middleware.use(request, mockResponse as Response, mockNext);

      expect(mockAllowedIpService.isIpAllowed).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should allow access for auth routes", async () => {
      const request = { ...mockRequest, path: "/admin/auth" } as Request;

      await middleware.use(request, mockResponse as Response, mockNext);

      expect(mockAllowedIpService.isIpAllowed).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should reject access when user is not authenticated", async () => {
      const request = {
        ...mockRequest,
        path: "/admin/profile",
        user: null,
      } as any;

      await expect(
        middleware.use(request, mockResponse as Response, mockNext),
      ).rejects.toThrow("Authentication required to access admin routes");

      expect(mockAllowedIpService.isIpAllowed).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should allow access when IP is allowed", async () => {
      const request = {
        ...mockRequest,
        path: "/admin/profile",
        user: { id: "user-123" },
      } as any;

      mockAllowedIpService.isIpAllowed.mockResolvedValue(true);

      await middleware.use(request, mockResponse as Response, mockNext);

      expect(mockAllowedIpService.isIpAllowed).toHaveBeenCalledWith(
        "user-123",
        "192.168.1.1",
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should deny access when IP is not allowed", async () => {
      const request = {
        ...mockRequest,
        path: "/admin/profile",
        user: { id: "user-123" },
      } as any;

      mockAllowedIpService.isIpAllowed.mockResolvedValue(false);

      await expect(
        middleware.use(request, mockResponse as Response, mockNext),
      ).rejects.toThrow(ForbiddenException);

      expect(mockAllowedIpService.isIpAllowed).toHaveBeenCalledWith(
        "user-123",
        "192.168.1.1",
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException with correct message", async () => {
      const request = {
        ...mockRequest,
        path: "/admin/profile",
        user: { id: "user-123" },
      } as any;

      mockAllowedIpService.isIpAllowed.mockResolvedValue(false);

      try {
        await middleware.use(request, mockResponse as Response, mockNext);
      } catch (error: any) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toBe(
          "Access denied from IP address: 192.168.1.1. Please contact administrator to whitelist this IP.",
        );
      }
    });
  });

  describe("getClientIp", () => {
    it("should extract IP from x-forwarded-for header", () => {
      mockRequest.headers = {
        "x-forwarded-for": "203.0.113.1, 192.168.1.1",
      };

      const result = middleware["getClientIp"](mockRequest as Request);

      expect(result).toBe("203.0.113.1");
    });

    it("should extract IP from x-forwarded-for header with single IP", () => {
      mockRequest.headers = {
        "x-forwarded-for": "203.0.113.1",
      };

      const result = middleware["getClientIp"](mockRequest as Request);

      expect(result).toBe("203.0.113.1");
    });

    it("should extract IP from x-forwarded-for header with whitespace", () => {
      mockRequest.headers = {
        "x-forwarded-for": " 203.0.113.1 , 192.168.1.1 ",
      };

      const result = middleware["getClientIp"](mockRequest as Request);

      expect(result).toBe("203.0.113.1");
    });

    it("should extract IP from x-real-ip header when x-forwarded-for is not available", () => {
      mockRequest.headers = {
        "x-real-ip": "203.0.113.1",
      };

      const result = middleware["getClientIp"](mockRequest as Request);

      expect(result).toBe("203.0.113.1");
    });

    it("should extract IP from x-real-ip header when x-forwarded-for is not available", () => {
      const request = {
        ...mockRequest,
        headers: { "x-real-ip": "203.0.113.1" },
      } as any;

      const result = middleware["getClientIp"](request);

      expect(result).toBe("203.0.113.1");
    });

    it("should prioritize x-forwarded-for over other headers", () => {
      mockRequest.headers = {
        "x-forwarded-for": "203.0.113.1",
        "x-real-ip": "192.168.1.1",
        "cf-connecting-ip": "10.0.0.1",
      };

      const result = middleware["getClientIp"](mockRequest as Request);

      expect(result).toBe("203.0.113.1");
    });

    it("should return connection remote address when no headers are present", () => {
      const request = {
        ...mockRequest,
        headers: {},
        connection: { remoteAddress: "192.168.1.1" },
      } as any;

      const result = middleware["getClientIp"](request);

      expect(result).toBe("192.168.1.1");
    });

    it("should return socket remote address when connection is not available", () => {
      const request = {
        ...mockRequest,
        headers: {},
        connection: { remoteAddress: undefined },
        socket: { remoteAddress: "192.168.1.1" },
      } as any;

      const result = middleware["getClientIp"](request);

      expect(result).toBe("192.168.1.1");
    });

    it("should return unknown when no IP information is available", () => {
      const request = {
        ...mockRequest,
        headers: {},
        connection: { remoteAddress: undefined },
        socket: { remoteAddress: undefined },
      } as any;

      const result = middleware["getClientIp"](request);

      expect(result).toBe("unknown");
    });

    it("should handle array headers", () => {
      mockRequest.headers = {
        "x-forwarded-for": ["203.0.113.1", "192.168.1.1"],
      };

      const result = middleware["getClientIp"](mockRequest as Request);

      expect(result).toBe("203.0.113.1");
    });

    it("should handle empty x-forwarded-for header", () => {
      const request = {
        ...mockRequest,
        headers: { "x-forwarded-for": "" },
      } as any;

      const result = middleware["getClientIp"](request);

      expect(result).toBe("192.168.1.1");
    });

    it("should handle IPv6 addresses", () => {
      mockRequest.headers = {
        "x-forwarded-for": "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      };

      const result = middleware["getClientIp"](mockRequest as Request);

      expect(result).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    });

    it("should handle multiple IPv6 addresses", () => {
      mockRequest.headers = {
        "x-forwarded-for": "2001:0db8:85a3:0000:0000:8a2e:0370:7334, ::1",
      };

      const result = middleware["getClientIp"](mockRequest as Request);

      expect(result).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    });
  });

  describe("integration tests", () => {
    it("should handle complete admin request flow with allowed IP", async () => {
      const request = {
        ...mockRequest,
        path: "/admin/profile",
        user: { id: "user-123" },
        headers: { "x-forwarded-for": "203.0.113.1" },
      } as any;

      mockAllowedIpService.isIpAllowed.mockResolvedValue(true);

      await middleware.use(request, mockResponse as Response, mockNext);

      expect(mockAllowedIpService.isIpAllowed).toHaveBeenCalledWith(
        "user-123",
        "203.0.113.1",
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should handle complete admin request flow with denied IP", async () => {
      const request = {
        ...mockRequest,
        path: "/admin/profile",
        user: { id: "user-123" },
        headers: { "x-forwarded-for": "203.0.113.1" },
      } as any;

      mockAllowedIpService.isIpAllowed.mockResolvedValue(false);

      await expect(
        middleware.use(request, mockResponse as Response, mockNext),
      ).rejects.toThrow(ForbiddenException);

      expect(mockAllowedIpService.isIpAllowed).toHaveBeenCalledWith(
        "user-123",
        "203.0.113.1",
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle admin routes with different path patterns", async () => {
      const adminPaths = [
        "/admin/profile",
        "/admin/users",
        "/admin/settings",
        "/admin/dashboard",
        "/admin/reports",
      ];

      for (const path of adminPaths) {
        const request = {
          ...mockRequest,
          path,
          user: { id: "user-123" },
        } as any;
        mockAllowedIpService.isIpAllowed.mockResolvedValue(true);

        await middleware.use(request, mockResponse as Response, mockNext);

        expect(mockAllowedIpService.isIpAllowed).toHaveBeenCalledWith(
          "user-123",
          "192.168.1.1",
        );
        expect(mockNext).toHaveBeenCalledWith();

        // Reset mocks for next iteration
        vi.clearAllMocks();
      }
    });

    it("should handle non-admin routes with different path patterns", async () => {
      const nonAdminPaths = [
        "/api/public",
        "/auth/login",
        "/health",
        "/docs",
        "/favicon.ico",
      ];

      for (const path of nonAdminPaths) {
        const request = {
          ...mockRequest,
          path,
          user: { id: "user-123" },
        } as any;

        await middleware.use(request, mockResponse as Response, mockNext);

        expect(mockAllowedIpService.isIpAllowed).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith();

        // Reset mocks for next iteration
        vi.clearAllMocks();
      }
    });
  });
});
