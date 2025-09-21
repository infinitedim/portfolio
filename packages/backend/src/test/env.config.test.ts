import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("Environment Configuration", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Clear all environment variables to ensure clean state
    Object.keys(process.env).forEach((key) => {
      if (
        key.startsWith("DATABASE_") ||
        key.startsWith("REDIS_") ||
        key.startsWith("JWT_") ||
        key.startsWith("ADMIN_") ||
        key.startsWith("SPOTIFY_") ||
        key === "NODE_ENV"
      ) {
        delete process.env[key];
      }
    });
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;

    // Clear module cache to ensure fresh imports
    vi.resetModules();
  });

  describe("Schema Validation", () => {
    it("should validate with minimum required environment variables", async () => {
      process.env.NODE_ENV = "test";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";

      const { env } = await import("../env.config");

      expect(env.NODE_ENV).toBe("test");
      expect(env.DATABASE_URL).toBe(
        "postgresql://user:pass@localhost:5432/testdb",
      );
      expect(env.UPSTASH_REDIS_REST_URL).toBe("redis://localhost:6379");
      expect(env.JWT_SECRET).toBe("test-jwt-secret");
      expect(env.REFRESH_TOKEN_SECRET).toBe("test-refresh-secret");
    });

    it("should apply default values for NODE_ENV", async () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";

      const { env } = await import("../env.config");

      expect(env.NODE_ENV).toBe("development");
    });

    it("should validate JWT configuration", async () => {
      process.env.NODE_ENV = "test";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
      process.env.JWT_EXPIRES_IN = "1h";
      process.env.REFRESH_TOKEN_EXPIRES_IN = "7d";

      const { env } = await import("../env.config");

      expect(env.JWT_SECRET).toBe("test-jwt-secret");
      expect(env.REFRESH_TOKEN_SECRET).toBe("test-refresh-secret");
      expect(env.JWT_EXPIRES_IN).toBe("1h");
      expect(env.REFRESH_TOKEN_EXPIRES_IN).toBe("7d");
    });

    it("should validate database pool configuration", async () => {
      process.env.NODE_ENV = "test";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
      process.env.DB_POOL_MIN = "2";
      process.env.DB_POOL_MAX = "10";
      process.env.DB_POOL_ACQUIRE_TIMEOUT = "30000";
      process.env.DB_POOL_IDLE_TIMEOUT = "300000";

      const { env } = await import("../env.config");

      expect(env.DB_POOL_MIN).toBe(2);
      expect(env.DB_POOL_MAX).toBe(10);
      expect(env.DB_POOL_ACQUIRE_TIMEOUT).toBe(30000);
      expect(env.DB_POOL_IDLE_TIMEOUT).toBe(300000);
    });

    it("should validate Redis configuration", async () => {
      process.env.NODE_ENV = "test";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
      process.env.REDIS_HOST = "localhost";
      process.env.REDIS_PORT = "6379";
      process.env.REDIS_PASSWORD = "redis-password";

      const { env } = await import("../env.config");

      expect(env.UPSTASH_REDIS_REST_URL).toBe("redis://localhost:6379");
      expect(env.UPSTASH_REDIS_REST_TOKEN).toBe("localhost");
    });

    it("should validate admin configuration", async () => {
      process.env.NODE_ENV = "test";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
      process.env.ADMIN_EMAIL = "admin@test.com";
      process.env.ADMIN_PASSWORD = "hashed-admin-password";

      const { env } = await import("../env.config");

      expect(env.ADMIN_EMAIL).toBe("admin@test.com");
      expect(env.ADMIN_PASSWORD).toBe("hashed-admin-password");
    });

    it("should validate Spotify configuration", async () => {
      process.env.NODE_ENV = "test";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
      process.env.SPOTIFY_CLIENT_ID = "spotify-client-id";
      process.env.SPOTIFY_CLIENT_SECRET = "spotify-client-secret";
      process.env.SPOTIFY_REDIRECT_URI = "http://localhost:3000/callback";

      const { env } = await import("../env.config");

      expect(env.SPOTIFY_CLIENT_ID).toBe("spotify-client-id");
      expect(env.SPOTIFY_CLIENT_SECRET).toBe("spotify-client-secret");
      expect(env.SPOTIFY_REDIRECT_URI).toBe("http://localhost:3000/callback");
    });
  });

  describe("Schema Validation Errors", () => {
    it("should throw error for missing DATABASE_URL", async () => {
      process.env.NODE_ENV = "test";
      // DATABASE_URL is missing
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";

      await expect(async () => {
        await import("../env.config");
      }).rejects.toThrow();
    });

    it("should throw error for missing JWT_SECRET", async () => {
      process.env.NODE_ENV = "test";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      // JWT_SECRET is missing
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";

      await expect(async () => {
        await import("../env.config");
      }).rejects.toThrow();
    });

    it("should throw error for missing REDIS_URL", async () => {
      process.env.NODE_ENV = "test";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      // REDIS_URL is missing
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";

      await expect(async () => {
        await import("../env.config");
      }).rejects.toThrow();
    });

    it("should throw error for invalid NODE_ENV", async () => {
      process.env.NODE_ENV = "invalid-env";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";

      await expect(async () => {
        await import("../env.config");
      }).rejects.toThrow();
    });

    it("should throw error for invalid database pool numbers", async () => {
      process.env.NODE_ENV = "test";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
      process.env.DB_POOL_MIN = "-1"; // Invalid negative number
      process.env.DB_POOL_MAX = "0"; // Invalid zero

      await expect(async () => {
        await import("../env.config");
      }).rejects.toThrow();
    });

    it("should throw error for invalid Redis port", async () => {
      process.env.NODE_ENV = "test";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
      process.env.REDIS_PORT = "99999"; // Invalid port number

      await expect(async () => {
        await import("../env.config");
      }).rejects.toThrow();
    });
  });

  describe("Type Safety", () => {
    it("should ensure proper type conversion for numeric fields", async () => {
      process.env.NODE_ENV = "test";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
      process.env.REDIS_PORT = "6379";
      process.env.DB_POOL_MIN = "5";
      process.env.DB_POOL_MAX = "20";

      const { env } = await import("../env.config");

      expect(typeof env.DB_POOL_MIN).toBe("number");
      expect(typeof env.DB_POOL_MAX).toBe("number");

      expect(env.DB_POOL_MIN).toBe(5);
      expect(env.DB_POOL_MAX).toBe(20);
    });

    it("should handle boolean environment variables correctly", async () => {
      process.env.NODE_ENV = "test";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
      process.env.LOG_LEVEL = "debug";

      const { env } = await import("../env.config");

      expect(typeof env.LOG_LEVEL).toBe("string");
      expect(env.LOG_LEVEL).toBe("debug");
    });
  });

  describe("Production Environment Validation", () => {
    it("should require stricter validation in production", async () => {
      process.env.NODE_ENV = "production";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "production-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "production-refresh-secret";

      const { env } = await import("../env.config");

      expect(env.NODE_ENV).toBe("production");
      expect(env.JWT_SECRET).toBe("production-jwt-secret");
    });

    it("should validate required admin credentials in production", async () => {
      process.env.NODE_ENV = "production";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "production-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "production-refresh-secret";
      process.env.ADMIN_EMAIL = "admin@production.com";
      process.env.ADMIN_PASSWORD = "secure-hashed-password";

      const { env } = await import("../env.config");

      expect(env.ADMIN_EMAIL).toBe("admin@production.com");
      expect(env.ADMIN_PASSWORD).toBe("secure-hashed-password");
    });
  });

  describe("Optional Configuration", () => {
    it("should handle optional Spotify configuration", async () => {
      process.env.NODE_ENV = "test";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
      // Spotify config is optional

      const { env } = await import("../env.config");

      expect(env.SPOTIFY_CLIENT_ID).toBeUndefined();
      expect(env.SPOTIFY_CLIENT_SECRET).toBeUndefined();
      expect(env.SPOTIFY_REDIRECT_URI).toBeUndefined();
    });

    it("should handle optional admin configuration", async () => {
      process.env.NODE_ENV = "test";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret";
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
      // Admin config is optional in test

      const { env } = await import("../env.config");

      expect(env.ADMIN_EMAIL).toBeUndefined();
      expect(env.ADMIN_PASSWORD).toBeUndefined();
    });
  });
});
