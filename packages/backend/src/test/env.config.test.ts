import { describe, it, expect, beforeEach, vi } from "vitest";
import { validateEnv, getEnv } from "../env.config";

describe("Environment Configuration", () => {
  // Helper to create minimal valid env
  const createMinimalEnv = (): NodeJS.ProcessEnv => ({
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/testdb",
    UPSTASH_REDIS_REST_URL: "https://redis.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "test-token",
    JWT_SECRET:
      "test-jwt-secret-that-is-long-enough-to-meet-minimum-requirements-of-32-chars",
    REFRESH_TOKEN_SECRET:
      "test-refresh-secret-that-is-long-enough-to-meet-minimum-requirements-of-32-chars",
    ADMIN_EMAIL: "admin@test.com",
    ADMIN_PASSWORD: "test-admin-password-hash",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateEnv function", () => {
    it("should validate with minimum required environment variables", () => {
      const testEnv = createMinimalEnv();
      const env = validateEnv(testEnv);

      expect(env.NODE_ENV).toBe("test");
      expect(env.DATABASE_URL).toBe(
        "postgresql://user:pass@localhost:5432/testdb",
      );
      expect(env.UPSTASH_REDIS_REST_URL).toBe("https://redis.upstash.io");
    });

    it("should apply default values for NODE_ENV", () => {
      const testEnv = createMinimalEnv();
      delete testEnv.NODE_ENV;
      const env = validateEnv(testEnv);

      expect(env.NODE_ENV).toBe("development");
    });

    it("should validate JWT configuration", () => {
      const testEnv = {
        ...createMinimalEnv(),
        JWT_EXPIRES_IN: "1h",
        REFRESH_TOKEN_EXPIRES_IN: "7d",
      };
      const env = validateEnv(testEnv);

      expect(env.JWT_EXPIRES_IN).toBe("1h");
      expect(env.REFRESH_TOKEN_EXPIRES_IN).toBe("7d");
    });

    it("should validate database pool configuration", () => {
      const testEnv = {
        ...createMinimalEnv(),
        DB_POOL_MIN: "2",
        DB_POOL_MAX: "10",
        DB_POOL_ACQUIRE_TIMEOUT: "30000",
        DB_POOL_IDLE_TIMEOUT: "300000",
      };
      const env = validateEnv(testEnv);

      expect(env.DB_POOL_MIN).toBe(2);
      expect(env.DB_POOL_MAX).toBe(10);
      expect(env.DB_POOL_ACQUIRE_TIMEOUT).toBe(30000);
      expect(env.DB_POOL_IDLE_TIMEOUT).toBe(300000);
    });

    it("should validate admin configuration", () => {
      const testEnv = {
        ...createMinimalEnv(),
        ADMIN_EMAIL: "admin@test.com",
        ADMIN_PASSWORD: "hashed-admin-password",
      };
      const env = validateEnv(testEnv);

      expect(env.ADMIN_EMAIL).toBe("admin@test.com");
      expect(env.ADMIN_PASSWORD).toBe("hashed-admin-password");
    });

    it("should validate Spotify configuration", () => {
      const testEnv = {
        ...createMinimalEnv(),
        SPOTIFY_CLIENT_ID: "spotify-client-id",
        SPOTIFY_CLIENT_SECRET: "spotify-client-secret",
        SPOTIFY_REDIRECT_URI: "http://localhost:3000/callback",
      };
      const env = validateEnv(testEnv);

      expect(env.SPOTIFY_CLIENT_ID).toBe("spotify-client-id");
      expect(env.SPOTIFY_CLIENT_SECRET).toBe("spotify-client-secret");
      expect(env.SPOTIFY_REDIRECT_URI).toBe("http://localhost:3000/callback");
    });
  });

  describe("Schema Validation Errors", () => {
    it("should throw error for missing DATABASE_URL", () => {
      const testEnv = createMinimalEnv();
      delete testEnv.DATABASE_URL;

      expect(() => validateEnv(testEnv)).toThrow();
    });

    it("should throw error for missing JWT_SECRET", () => {
      const testEnv = createMinimalEnv();
      delete testEnv.JWT_SECRET;

      expect(() => validateEnv(testEnv)).toThrow();
    });

    it("should throw error for missing UPSTASH_REDIS_REST_URL", () => {
      const testEnv = createMinimalEnv();
      delete testEnv.UPSTASH_REDIS_REST_URL;

      expect(() => validateEnv(testEnv)).toThrow();
    });

    it("should throw error for invalid NODE_ENV", () => {
      const testEnv = {
        ...createMinimalEnv(),
        NODE_ENV: "invalid-env",
      };

      expect(() => validateEnv(testEnv)).toThrow();
    });

    it("should throw error for invalid database pool numbers", () => {
      const testEnv = {
        ...createMinimalEnv(),
        DB_POOL_MIN: "-1",
        DB_POOL_MAX: "0",
      };

      expect(() => validateEnv(testEnv)).toThrow();
    });
  });

  describe("Type Safety", () => {
    it("should ensure proper type conversion for numeric fields", () => {
      const testEnv = createMinimalEnv();
      testEnv.DB_POOL_MIN = "5";
      testEnv.DB_POOL_MAX = "20";
      testEnv.PORT = "3000";
      const env = validateEnv(testEnv);

      expect(typeof env.DB_POOL_MIN).toBe("number");
      expect(typeof env.DB_POOL_MAX).toBe("number");
      expect(typeof env.PORT).toBe("number");
      expect(env.DB_POOL_MIN).toBe(5);
      expect(env.DB_POOL_MAX).toBe(20);
      expect(env.PORT).toBe(3000);
    });

    it("should handle string environment variables correctly", () => {
      const testEnv = createMinimalEnv();
      testEnv.LOG_LEVEL = "debug";
      const env = validateEnv(testEnv);

      expect(typeof env.LOG_LEVEL).toBe("string");
      expect(env.LOG_LEVEL).toBe("debug");
    });
  });

  describe("Optional Configuration", () => {
    it("should handle optional Spotify configuration", () => {
      const testEnv = createMinimalEnv();
      const env = validateEnv(testEnv);

      expect(env.SPOTIFY_CLIENT_ID).toBeUndefined();
      expect(env.SPOTIFY_CLIENT_SECRET).toBeUndefined();
      expect(env.SPOTIFY_REDIRECT_URI).toBeUndefined();
    });

    it("should handle optional admin configuration", () => {
      const testEnv = createMinimalEnv();
      const env = validateEnv(testEnv);

      // Admin fields are provided in createMinimalEnv
      expect(env.ADMIN_EMAIL).toBe("admin@test.com");
      expect(env.ADMIN_PASSWORD).toBe("test-admin-password-hash");
    });
  });

  describe("getEnv function", () => {
    it("should return the initialized env object", () => {
      const env = getEnv();

      expect(env).toBeDefined();
      expect(env.NODE_ENV).toBeDefined();
      expect(env.DATABASE_URL).toBeDefined();
    });

    it("should return consistent env object across calls", () => {
      const env1 = getEnv();
      const env2 = getEnv();

      expect(env1).toBe(env2); // Same reference
    });
  });
});
