import { describe, it, expect, beforeEach } from "vitest";
import { authService } from "@/lib/auth/auth-service";

// Mock localStorage and sessionStorage
const storageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

Object.defineProperty(global, "localStorage", {
  value: storageMock,
  writable: true,
  configurable: true,
});

Object.defineProperty(global, "sessionStorage", {
  value: storageMock,
  writable: true,
  configurable: true,
});

Object.defineProperty(global, "window", {
  value: {
    localStorage: storageMock,
    sessionStorage: storageMock,
  },
  writable: true,
  configurable: true,
});

describe("AuthService", () => {
  beforeEach(() => {
    // Clear the singleton instance
    (authService as any).accessToken = null;
    (authService as any).refreshToken = null;
    (authService as any).user = null;
  });

  describe("isAuthenticated", () => {
    it("should return true when user is authenticated", () => {
      (authService as any).accessToken = "access-token";
      (authService as any).user = {
        userId: "admin",
        email: "admin@portfolio.com",
        role: "admin",
      };

      expect(authService.isAuthenticated()).toBe(true);
    });

    it("should return false when user is not authenticated", () => {
      (authService as any).accessToken = null;
      (authService as any).user = null;

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe("getCurrentUser", () => {
    it("should return current user", () => {
      const mockUser = {
        userId: "admin",
        email: "admin@portfolio.com",
        role: "admin" as const,
      };
      (authService as any).user = mockUser;

      expect(authService.getCurrentUser()).toEqual(mockUser);
    });

    it("should return null when no user", () => {
      (authService as any).user = null;

      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe("getAccessToken", () => {
    it("should return access token", () => {
      (authService as any).accessToken = "test-token";
      expect(authService.getAccessToken()).toBe("test-token");
    });

    it("should return null when no token", () => {
      (authService as any).accessToken = null;
      expect(authService.getAccessToken()).toBeNull();
    });
  });
});
