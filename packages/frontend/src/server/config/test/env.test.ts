import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getEnv,
  isProduction,
  isDevelopment,
  isTest,
  getJWTConfig,
  getAdminConfig,
  getSpotifyConfig,
  getAIConfig,
} from "../env";

describe("Environment Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      JWT_SECRET: "a".repeat(64) + "A1!",
      REFRESH_TOKEN: "b".repeat(64) + "B2@",
      ADMIN_EMAIL: "admin@test.com",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    // Clear module cache to reset cached env
    vi.resetModules();
  });

  describe("getEnv", () => {
    it("should return validated environment variables", () => {
      const env = getEnv();

      expect(env).toHaveProperty("NODE_ENV");
      expect(env).toHaveProperty("DATABASE_URL");
      expect(env).toHaveProperty("JWT_SECRET");
      expect(env).toHaveProperty("REFRESH_TOKEN");
      expect(env).toHaveProperty("ADMIN_EMAIL");
    });

    it("should throw error for missing required variables", () => {
      delete process.env.DATABASE_URL;

      expect(() => {
        vi.resetModules();
        const { getEnv } = require("../env");
        getEnv();
      }).toThrow();
    });

    it("should throw error for invalid JWT_SECRET length", () => {
      process.env.JWT_SECRET = "short";

      expect(() => {
        vi.resetModules();
        const { getEnv } = require("../env");
        getEnv();
      }).toThrow();
    });

    it("should throw error for invalid ADMIN_EMAIL format", () => {
      process.env.ADMIN_EMAIL = "invalid-email";

      expect(() => {
        vi.resetModules();
        const { getEnv } = require("../env");
        getEnv();
      }).toThrow();
    });

    it("should validate production requirements", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.ADMIN_HASH_PASSWORD;

      vi.resetModules();
      const { getEnv } = await import("../env");

      expect(() => {
        getEnv();
      }).toThrow("ADMIN_HASH_PASSWORD is required in production");
    });

    it("should reject plain text password in production", async () => {
      process.env.NODE_ENV = "production";
      process.env.ADMIN_PASSWORD = "plain-text";
      process.env.ADMIN_HASH_PASSWORD = "$2a$10$test";

      vi.resetModules();
      const { getEnv } = await import("../env");

      expect(() => {
        getEnv();
      }).toThrow("Plain text ADMIN_PASSWORD is forbidden in production");
    });
  });

  describe("environment helpers", () => {
    it("should correctly identify production", async () => {
      process.env.NODE_ENV = "production";
      process.env.ADMIN_HASH_PASSWORD = "$2a$10$test";
      vi.resetModules();
      const { isProduction } = await import("../env");
      expect(isProduction()).toBe(true);
    });

    it("should correctly identify development", async () => {
      process.env.NODE_ENV = "development";
      vi.resetModules();
      const { isDevelopment } = await import("../env");
      expect(isDevelopment()).toBe(true);
    });

    it("should correctly identify test", async () => {
      process.env.NODE_ENV = "test";
      vi.resetModules();
      const { isTest } = await import("../env");
      expect(isTest()).toBe(true);
    });
  });

  describe("getJWTConfig", () => {
    it("should return JWT configuration", () => {
      const config = getJWTConfig();

      expect(config).toHaveProperty("secret");
      expect(config).toHaveProperty("expiresIn");
      expect(config).toHaveProperty("refreshSecret");
      expect(config).toHaveProperty("refreshExpiresIn");
      expect(config).toHaveProperty("issuer");
      expect(config).toHaveProperty("audience");
      expect(config.secret).toBe(process.env.JWT_SECRET);
      expect(config.expiresIn).toBe(process.env.JWT_EXPIRES_IN || "15m");
    });
  });

  describe("getAdminConfig", () => {
    it("should return admin configuration", async () => {
      process.env.ADMIN_PASSWORD = "test-password";
      process.env.ADMIN_HASH_PASSWORD = "$2a$10$test";

      vi.resetModules();
      const { getAdminConfig } = await import("../env");
      const config = getAdminConfig();

      expect(config).toHaveProperty("email");
      expect(config).toHaveProperty("password");
      expect(config).toHaveProperty("hashedPassword");
      expect(config.email).toBe(process.env.ADMIN_EMAIL);
    });
  });

  describe("getSpotifyConfig", () => {
    it("should return Spotify configuration", async () => {
      process.env.SPOTIFY_CLIENT_ID = "test-client-id";
      process.env.SPOTIFY_CLIENT_SECRET = "test-secret";
      process.env.SPOTIFY_REDIRECT_URI = "http://localhost:3000/callback";

      vi.resetModules();
      const { getSpotifyConfig } = await import("../env");
      const config = getSpotifyConfig();

      expect(config).toHaveProperty("clientId");
      expect(config).toHaveProperty("clientSecret");
      expect(config).toHaveProperty("redirectUri");
    });
  });

  describe("getAIConfig", () => {
    it("should return AI configuration", async () => {
      process.env.ANTHROPIC_API_KEY = "test-api-key";

      vi.resetModules();
      const { getAIConfig } = await import("../env");
      const config = getAIConfig();

      expect(config).toHaveProperty("anthropicKey");
    });
  });
});

