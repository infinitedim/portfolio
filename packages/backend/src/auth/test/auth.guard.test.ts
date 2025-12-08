import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "../auth.guard";
import type { AuthUser } from "../auth.service";

describe("AuthGuard", () => {
  let guard: AuthGuard;
  let mockAuthService: any;
  let mockExecutionContext: any;
  let mockRequest: any;

  beforeEach(() => {
    mockAuthService = {
      validateToken: vi.fn(),
    };

    mockRequest = {
      headers: {},
    };

    mockExecutionContext = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(mockRequest),
      }),
    };

    guard = new AuthGuard(mockAuthService);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe("canActivate", () => {
    it("should return true for valid Bearer token", async () => {
      const mockUser: AuthUser = {
        userId: "admin",
        email: "admin@example.com",
        role: "admin",
      };

      mockRequest.headers.authorization = "Bearer valid-token";
      mockAuthService.validateToken.mockResolvedValue(mockUser);

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        "valid-token",
        mockRequest,
      );
      expect(mockRequest.user).toEqual(mockUser);
    });

    it("should return true for valid token without Bearer prefix", async () => {
      const mockUser: AuthUser = {
        userId: "admin",
        email: "admin@example.com",
        role: "admin",
      };

      mockRequest.headers.authorization = "valid-token";
      mockAuthService.validateToken.mockResolvedValue(mockUser);

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        "valid-token",
        mockRequest,
      );
      expect(mockRequest.user).toEqual(mockUser);
    });

    it("should return false when no authorization header is present", async () => {
      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(false);
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it("should return false when authorization header is not a string", async () => {
      mockRequest.headers.authorization = ["Bearer", "token"];

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(false);
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it("should return false when authorization header is empty string", async () => {
      mockRequest.headers.authorization = "";

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(false);
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it("should return false for invalid token", async () => {
      mockRequest.headers.authorization = "Bearer invalid-token";
      mockAuthService.validateToken.mockRejectedValue(
        new Error("Invalid token"),
      );

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(false);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        "invalid-token",
        mockRequest,
      );
      expect(mockRequest.user).toBeUndefined();
    });

    it("should handle Bearer token with extra spaces", async () => {
      const mockUser: AuthUser = {
        userId: "admin",
        email: "admin@example.com",
        role: "admin",
      };

      mockRequest.headers.authorization = "Bearer  valid-token-with-spaces  ";
      mockAuthService.validateToken.mockResolvedValue(mockUser);

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        " valid-token-with-spaces  ",
        mockRequest,
      );
      expect(mockRequest.user).toEqual(mockUser);
    });

    it("should handle case-sensitive Bearer prefix", async () => {
      const mockUser: AuthUser = {
        userId: "admin",
        email: "admin@example.com",
        role: "admin",
      };

      mockRequest.headers.authorization = "bearer valid-token";
      mockAuthService.validateToken.mockResolvedValue(mockUser);

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        "bearer valid-token",
        mockRequest,
      );
      expect(mockRequest.user).toEqual(mockUser);
    });

    it("should handle token that starts with Bearer but has no space", async () => {
      const mockUser: AuthUser = {
        userId: "admin",
        email: "admin@example.com",
        role: "admin",
      };

      mockRequest.headers.authorization = "Bearervalid-token";
      mockAuthService.validateToken.mockResolvedValue(mockUser);

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        "Bearervalid-token",
        mockRequest,
      );
      expect(mockRequest.user).toEqual(mockUser);
    });

    it("should properly extract token from Bearer authorization", async () => {
      const mockUser: AuthUser = {
        userId: "admin",
        email: "admin@example.com",
        role: "admin",
      };

      mockRequest.headers.authorization =
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      mockAuthService.validateToken.mockResolvedValue(mockUser);

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        mockRequest,
      );
      expect(mockRequest.user).toEqual(mockUser);
    });

    it("should handle AuthService throwing an error", async () => {
      mockRequest.headers.authorization = "Bearer valid-token";
      mockAuthService.validateToken.mockRejectedValue(
        new Error("Token verification failed"),
      );

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(false);
    });

    it("should set user to undefined when verification returns null", async () => {
      mockRequest.headers.authorization = "Bearer invalid-token";
      mockAuthService.validateToken.mockRejectedValue(
        new Error("Invalid token"),
      );

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(false);
      expect(mockRequest.user).toBeUndefined();
    });

    it("should properly handle different authorization header formats", async () => {
      const testCases = [
        {
          header: "Bearer token123",
          expectedToken: "token123",
          shouldPass: true,
        },
        { header: "token456", expectedToken: "token456", shouldPass: true },
        {
          header: "Basic dXNlcjpwYXNz",
          expectedToken: "Basic dXNlcjpwYXNz",
          shouldPass: true,
        },
        { header: "Bearer ", expectedToken: "", shouldPass: false },
        { header: "Bearer", expectedToken: "Bearer", shouldPass: false },
      ];

      for (const { header, expectedToken, shouldPass } of testCases) {
        // Reset mocks
        vi.clearAllMocks();
        mockRequest.headers.authorization = header;

        if (shouldPass) {
          const mockUser: AuthUser = {
            userId: "admin",
            email: "admin@example.com",
            role: "admin",
          };
          mockAuthService.validateToken.mockResolvedValue(mockUser);
        } else {
          mockAuthService.validateToken.mockRejectedValue(
            new Error("Invalid token"),
          );
        }

        const result = await guard.canActivate(
          mockExecutionContext as ExecutionContext,
        );

        expect(mockAuthService.validateToken).toHaveBeenCalledWith(
          expectedToken,
          mockRequest,
        );
        expect(result).toBe(shouldPass);
      }
    });
  });
});
