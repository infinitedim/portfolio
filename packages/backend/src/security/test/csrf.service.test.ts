import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CSRFTokenService } from "../csrf.service";

describe("CSRFTokenService", () => {
  let service: CSRFTokenService;
  let mockRedisService: any;

  beforeEach(() => {
    mockRedisService = {
      set: vi.fn(),
      get: vi.fn(),
      del: vi.fn(),
      exists: vi.fn(),
      keys: vi.fn(),
    };

    service = new CSRFTokenService(mockRedisService as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("generateToken", () => {
    it("should generate a valid CSRF token", async () => {
      const sessionId = "test-session-123";
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.generateToken(sessionId);

      expect(result.token).toBeDefined();
      expect(result.token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(result.expiresAt).toBeGreaterThan(Date.now());
      expect(mockRedisService.set).toHaveBeenCalledWith(
        "csrf:test-session-123",
        expect.objectContaining({
          token: result.token,
          expiresAt: result.expiresAt,
        }),
        86400, // 24 hours
      );
    });
  });

  describe("validateToken", () => {
    it("should validate a correct token", async () => {
      const sessionId = "test-session-123";
      const token = "valid-token-123";
      const storedToken = {
        token: "valid-token-123",
        expiresAt: Date.now() + 3600000, // 1 hour from now
      };

      mockRedisService.get.mockResolvedValue(storedToken);

      const result = await service.validateToken(sessionId, token);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject expired token", async () => {
      const sessionId = "test-session-123";
      const token = "expired-token-123";
      const storedToken = {
        token: "expired-token-123",
        expiresAt: Date.now() - 3600000, // 1 hour ago
      };

      mockRedisService.get.mockResolvedValue(storedToken);
      mockRedisService.del.mockResolvedValue(undefined);

      const result = await service.validateToken(sessionId, token);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("CSRF token expired");
      expect(mockRedisService.del).toHaveBeenCalledWith(
        "csrf:test-session-123",
      );
    });

    it("should reject invalid token", async () => {
      const sessionId = "test-session-123";
      const token = "invalid-token-123";
      const storedToken = {
        token: "different-token-123",
        expiresAt: Date.now() + 3600000,
      };

      mockRedisService.get.mockResolvedValue(storedToken);

      const result = await service.validateToken(sessionId, token);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("CSRF token mismatch");
    });

    it("should handle missing token", async () => {
      const sessionId = "test-session-123";
      const token = "missing-token-123";

      mockRedisService.get.mockResolvedValue(null);

      const result = await service.validateToken(sessionId, token);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("CSRF token not found or expired");
    });
  });

  describe("extractTokenFromRequest", () => {
    it("should extract token from header", () => {
      const request = {
        headers: {
          "x-csrf-token": "header-token-123",
        },
        cookies: {},
        body: {},
      } as any;

      const result = service.extractTokenFromRequest(request);

      expect(result).toBe("header-token-123");
    });

    it("should extract token from cookie", () => {
      const request = {
        headers: {},
        cookies: {
          "csrf-token": "cookie-token-123",
        },
        body: {},
      } as any;

      const result = service.extractTokenFromRequest(request);

      expect(result).toBe("cookie-token-123");
    });

    it("should extract token from body", () => {
      const request = {
        headers: {},
        cookies: {},
        body: {
          _csrf: "body-token-123",
        },
      } as any;

      const result = service.extractTokenFromRequest(request);

      expect(result).toBe("body-token-123");
    });

    it("should return null when no token found", () => {
      const request = {
        headers: {},
        cookies: {},
        body: {},
      } as any;

      const result = service.extractTokenFromRequest(request);

      expect(result).toBeNull();
    });
  });

  describe("getSessionId", () => {
    it("should use session ID if available", () => {
      const request = {
        session: {
          id: "session-123",
        },
        headers: {
          "user-agent": "test-agent",
        },
      } as any;

      const result = service.getSessionId(request);

      expect(result).toBe("session-123");
    });

    it("should fallback to IP + User Agent hash", () => {
      const request = {
        headers: {
          "user-agent": "test-agent",
        },
        connection: {
          remoteAddress: "192.168.1.1",
        },
      } as any;

      const result = service.getSessionId(request);

      expect(result).toHaveLength(64); // SHA-256 hash length
      expect(typeof result).toBe("string");
    });
  });
});
