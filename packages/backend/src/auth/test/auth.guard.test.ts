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
      verify: vi.fn(),
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
    it("should return true for valid Bearer token", () => {
      const mockUser: AuthUser = {
        userId: "admin",
        email: "admin@example.com",
        role: "admin",
      };

      mockRequest.headers.authorization = "Bearer valid-token";
      mockAuthService.verify.mockReturnValue(mockUser);

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockAuthService.verify).toHaveBeenCalledWith("valid-token");
      expect(mockRequest.user).toEqual(mockUser);
    });

    it("should return true for valid token without Bearer prefix", () => {
      const mockUser: AuthUser = {
        userId: "admin",
        email: "admin@example.com",
        role: "admin",
      };

      mockRequest.headers.authorization = "valid-token";
      mockAuthService.verify.mockReturnValue(mockUser);

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockAuthService.verify).toHaveBeenCalledWith("valid-token");
      expect(mockRequest.user).toEqual(mockUser);
    });

    it("should return false when no authorization header is present", () => {
      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(false);
      expect(mockAuthService.verify).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it("should return false when authorization header is not a string", () => {
      mockRequest.headers.authorization = ["Bearer", "token"];

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(false);
      expect(mockAuthService.verify).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it("should return false when authorization header is empty string", () => {
      mockRequest.headers.authorization = "";

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(false);
      expect(mockAuthService.verify).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it("should return false for invalid token", () => {
      mockRequest.headers.authorization = "Bearer invalid-token";
      mockAuthService.verify.mockReturnValue(null);

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(false);
      expect(mockAuthService.verify).toHaveBeenCalledWith("invalid-token");
      expect(mockRequest.user).toBeUndefined();
    });

    it("should handle Bearer token with extra spaces", () => {
      const mockUser: AuthUser = {
        userId: "admin",
        email: "admin@example.com",
        role: "admin",
      };

      mockRequest.headers.authorization = "Bearer  valid-token-with-spaces  ";
      mockAuthService.verify.mockReturnValue(mockUser);

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockAuthService.verify).toHaveBeenCalledWith(
        " valid-token-with-spaces  ",
      );
      expect(mockRequest.user).toEqual(mockUser);
    });

    it("should handle case-sensitive Bearer prefix", () => {
      const mockUser: AuthUser = {
        userId: "admin",
        email: "admin@example.com",
        role: "admin",
      };

      mockRequest.headers.authorization = "bearer valid-token";
      mockAuthService.verify.mockReturnValue(mockUser);

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockAuthService.verify).toHaveBeenCalledWith("bearer valid-token");
      expect(mockRequest.user).toEqual(mockUser);
    });

    it("should handle token that starts with Bearer but has no space", () => {
      const mockUser: AuthUser = {
        userId: "admin",
        email: "admin@example.com",
        role: "admin",
      };

      mockRequest.headers.authorization = "Bearervalid-token";
      mockAuthService.verify.mockReturnValue(mockUser);

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockAuthService.verify).toHaveBeenCalledWith("Bearervalid-token");
      expect(mockRequest.user).toEqual(mockUser);
    });

    it("should properly extract token from Bearer authorization", () => {
      const mockUser: AuthUser = {
        userId: "admin",
        email: "admin@example.com",
        role: "admin",
      };

      mockRequest.headers.authorization =
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      mockAuthService.verify.mockReturnValue(mockUser);

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockAuthService.verify).toHaveBeenCalledWith(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
      );
      expect(mockRequest.user).toEqual(mockUser);
    });

    it("should handle AuthService throwing an error", () => {
      mockRequest.headers.authorization = "Bearer valid-token";
      mockAuthService.verify.mockImplementation(() => {
        throw new Error("Token verification failed");
      });

      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow("Token verification failed");
    });

    it("should set user to undefined when verification returns null", () => {
      mockRequest.headers.authorization = "Bearer invalid-token";
      mockAuthService.verify.mockReturnValue(null);

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(false);
      expect(mockRequest.user).toBeUndefined();
    });

    it("should properly handle different authorization header formats", () => {
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

      testCases.forEach(({ header, expectedToken, shouldPass }) => {
        // Reset mocks
        vi.clearAllMocks();
        mockRequest.headers.authorization = header;

        if (shouldPass) {
          const mockUser: AuthUser = {
            userId: "admin",
            email: "admin@example.com",
            role: "admin",
          };
          mockAuthService.verify.mockReturnValue(mockUser);
        } else {
          mockAuthService.verify.mockReturnValue(null);
        }

        const result = guard.canActivate(
          mockExecutionContext as ExecutionContext,
        );

        expect(mockAuthService.verify).toHaveBeenCalledWith(expectedToken);
        expect(result).toBe(shouldPass);
      });
    });
  });
});
