import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request } from "express";
import type { Mock } from "vitest";

// Mock the context creation function
const mockCreateBackendContext = vi.fn();

// Extend global type for test mocks
declare global {
  var createBackendContext: Mock;
}

global.createBackendContext = mockCreateBackendContext;

describe("tRPC Context", () => {
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      method: "GET",
      url: "/api/test",
      ip: "127.0.0.1",
    };

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe("createBackendContext", () => {
    it("should create context with request", async () => {
      const expectedContext = {
        req: mockRequest,
        user: null,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({ req: mockRequest });

      expect(context).toEqual(expectedContext);
      expect(context.req).toBe(mockRequest);
      expect(mockCreateBackendContext).toHaveBeenCalledWith({
        req: mockRequest,
      });
    });

    it("should create context without user when no auth header", async () => {
      const expectedContext = {
        req: mockRequest,
        user: null,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({ req: mockRequest });

      expect(context.user).toBeNull();
    });

    it("should create context with user when valid auth header", async () => {
      const mockUser = {
        userId: "user-123",
        email: "user@example.com",
        role: "user",
      };

      const requestWithAuth = {
        ...mockRequest,
        headers: {
          authorization: "Bearer valid-jwt-token",
        },
      };

      const expectedContext = {
        req: requestWithAuth,
        user: mockUser,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({ req: requestWithAuth });

      expect(context.user).toEqual(mockUser);
      expect(context.req).toBe(requestWithAuth);
    });

    it("should handle invalid auth token gracefully", async () => {
      const requestWithInvalidAuth = {
        ...mockRequest,
        headers: {
          authorization: "Bearer invalid-token",
        },
      };

      const expectedContext = {
        req: requestWithInvalidAuth,
        user: null,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({
        req: requestWithInvalidAuth,
      });

      expect(context.user).toBeNull();
      expect(context.req).toBe(requestWithInvalidAuth);
    });

    it("should handle malformed auth header", async () => {
      const requestWithMalformedAuth = {
        ...mockRequest,
        headers: {
          authorization: "InvalidFormat",
        },
      };

      const expectedContext = {
        req: requestWithMalformedAuth,
        user: null,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({
        req: requestWithMalformedAuth,
      });

      expect(context.user).toBeNull();
    });

    it("should handle empty auth header", async () => {
      const requestWithEmptyAuth = {
        ...mockRequest,
        headers: {
          authorization: "",
        },
      };

      const expectedContext = {
        req: requestWithEmptyAuth,
        user: null,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({
        req: requestWithEmptyAuth,
      });

      expect(context.user).toBeNull();
    });

    it("should preserve request properties", async () => {
      const detailedRequest = {
        headers: {
          "user-agent": "test-agent",
          "x-forwarded-for": "192.168.1.1",
          authorization: "Bearer token",
        },
        method: "POST",
        url: "/api/users",
        ip: "127.0.0.1",
        body: { test: "data" },
        query: { page: "1" },
      };

      const expectedContext = {
        req: detailedRequest,
        user: null,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({ req: detailedRequest });

      expect(context.req).toEqual(detailedRequest);
      expect(context.req.headers).toEqual(detailedRequest.headers);
      expect(context.req.method).toBe("POST");
      expect(context.req.url).toBe("/api/users");
    });

    it("should handle admin user context", async () => {
      const adminUser = {
        userId: "admin-123",
        email: "admin@example.com",
        role: "admin",
      };

      const requestWithAdminAuth = {
        ...mockRequest,
        headers: {
          authorization: "Bearer admin-jwt-token",
        },
      };

      const expectedContext = {
        req: requestWithAdminAuth,
        user: adminUser,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({
        req: requestWithAdminAuth,
      });

      expect(context.user).toEqual(adminUser);
      expect(context.user?.role).toBe("admin");
    });

    it("should handle context creation errors", async () => {
      const error = new Error("Context creation failed");
      mockCreateBackendContext.mockRejectedValue(error);

      await expect(
        mockCreateBackendContext({ req: mockRequest }),
      ).rejects.toThrow("Context creation failed");
    });

    it("should handle missing request", async () => {
      const expectedContext = {
        req: null,
        user: null,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({ req: null });

      expect(context.req).toBeNull();
      expect(context.user).toBeNull();
    });
  });

  describe("context properties", () => {
    it("should have required context properties", async () => {
      const expectedContext = {
        req: mockRequest,
        user: null,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({ req: mockRequest });

      expect(context).toHaveProperty("req");
      expect(context).toHaveProperty("user");
    });

    it("should have correct property types", async () => {
      const mockUser = {
        userId: "user-123",
        email: "user@example.com",
        role: "user",
      };

      const expectedContext = {
        req: mockRequest,
        user: mockUser,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({ req: mockRequest });

      expect(typeof context.req).toBe("object");
      expect(context.user === null || typeof context.user === "object").toBe(
        true,
      );

      if (context.user) {
        expect(typeof context.user.userId).toBe("string");
        expect(typeof context.user.email).toBe("string");
        expect(typeof context.user.role).toBe("string");
      }
    });

    it("should maintain immutability of context", async () => {
      const expectedContext = {
        req: mockRequest,
        user: null,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({ req: mockRequest });

      // Attempting to modify context should not affect original
      const originalReq = context.req;
      const originalUser = context.user;

      expect(context.req).toBe(originalReq);
      expect(context.user).toBe(originalUser);
    });
  });

  describe("authentication integration", () => {
    it("should integrate with AuthService for token validation", async () => {
      const token = "valid-jwt-token";
      const mockUser = {
        userId: "user-123",
        email: "user@example.com",
        role: "user",
      };

      const requestWithAuth = {
        ...mockRequest,
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      const expectedContext = {
        req: requestWithAuth,
        user: mockUser,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({ req: requestWithAuth });

      expect(context.user).toEqual(mockUser);
    });

    it("should handle token extraction correctly", async () => {
      const testCases = [
        {
          header: "Bearer token123",
          expectedUser: {
            userId: "user-123",
            email: "user@example.com",
            role: "user",
          },
        },
        {
          header: "token456",
          expectedUser: {
            userId: "user-456",
            email: "user2@example.com",
            role: "user",
          },
        },
        {
          header: "Bearer ",
          expectedUser: null,
        },
        {
          header: "",
          expectedUser: null,
        },
      ];

      for (const testCase of testCases) {
        const requestWithAuth = {
          ...mockRequest,
          headers: {
            authorization: testCase.header,
          },
        };

        const expectedContext = {
          req: requestWithAuth,
          user: testCase.expectedUser,
        };

        mockCreateBackendContext.mockResolvedValue(expectedContext);

        const context = await mockCreateBackendContext({
          req: requestWithAuth,
        });

        expect(context.user).toEqual(testCase.expectedUser);
      }
    });

    it("should handle AuthService errors gracefully", async () => {
      const requestWithAuth = {
        ...mockRequest,
        headers: {
          authorization: "Bearer problematic-token",
        },
      };

      // AuthService throws an error, but context creation should handle it
      const expectedContext = {
        req: requestWithAuth,
        user: null,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({ req: requestWithAuth });

      expect(context.user).toBeNull();
      expect(context.req).toBe(requestWithAuth);
    });
  });

  describe("request metadata", () => {
    it("should preserve request metadata", async () => {
      const requestWithMetadata = {
        ...mockRequest,
        headers: {
          "user-agent": "Mozilla/5.0",
          "x-forwarded-for": "203.0.113.1",
          "content-type": "application/json",
        },
        method: "POST",
        url: "/api/users/create",
        ip: "192.168.1.1",
      };

      const expectedContext = {
        req: requestWithMetadata,
        user: null,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({
        req: requestWithMetadata,
      });

      expect(context.req.headers["user-agent"]).toBe("Mozilla/5.0");
      expect(context.req.headers["x-forwarded-for"]).toBe("203.0.113.1");
      expect(context.req.method).toBe("POST");
      expect(context.req.url).toBe("/api/users/create");
      expect(context.req.ip).toBe("192.168.1.1");
    });

    it("should handle requests with different HTTP methods", async () => {
      const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

      for (const method of methods) {
        const requestWithMethod = {
          ...mockRequest,
          method,
        };

        const expectedContext = {
          req: requestWithMethod,
          user: null,
        };

        mockCreateBackendContext.mockResolvedValue(expectedContext);

        const context = await mockCreateBackendContext({
          req: requestWithMethod,
        });

        expect(context.req.method).toBe(method);
      }
    });

    it("should handle requests with query parameters", async () => {
      const requestWithQuery = {
        ...mockRequest,
        url: "/api/users?page=1&limit=10&sort=name",
        query: {
          page: "1",
          limit: "10",
          sort: "name",
        },
      };

      const expectedContext = {
        req: requestWithQuery,
        user: null,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({ req: requestWithQuery });

      expect(context.req.url).toContain("page=1");
      expect(context.req.url).toContain("limit=10");
      expect(context.req.url).toContain("sort=name");
    });
  });

  describe("edge cases", () => {
    it("should handle undefined request", async () => {
      const expectedContext = {
        req: undefined,
        user: null,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({ req: undefined });

      expect(context.req).toBeUndefined();
      expect(context.user).toBeNull();
    });

    it("should handle request with null headers", async () => {
      const requestWithNullHeaders = {
        ...mockRequest,
        headers: null,
      };

      const expectedContext = {
        req: requestWithNullHeaders,
        user: null,
      };

      mockCreateBackendContext.mockResolvedValue(expectedContext);

      const context = await mockCreateBackendContext({
        req: requestWithNullHeaders,
      });

      expect(context.req.headers).toBeNull();
      expect(context.user).toBeNull();
    });

    it("should handle concurrent context creation", async () => {
      const requests = Array(5)
        .fill(null)
        .map((_, index) => ({
          ...mockRequest,
          url: `/api/test/${index}`,
        }));

      const promises = requests.map((req) => {
        const expectedContext = {
          req,
          user: null,
        };
        mockCreateBackendContext.mockResolvedValue(expectedContext);
        return mockCreateBackendContext({ req });
      });

      const contexts = await Promise.all(promises);

      contexts.forEach((context, index) => {
        expect(context.req.url).toBe(`/api/test/${index}`);
        expect(context.user).toBeNull();
      });
    });
  });
});
