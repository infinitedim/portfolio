import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ServerlessConfig } from "../serverless.config";

describe("ServerlessConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    delete process.env.VERCEL_URL;
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_PRISMA_URL;
    delete process.env.DATABASE_URL_NON_POOLING;
    delete process.env.DB_POOL_MIN;
    delete process.env.DB_POOL_MAX;
    delete process.env.DB_POOL_ACQUIRE_TIMEOUT;
    delete process.env.DB_POOL_IDLE_TIMEOUT;
    delete process.env.DB_QUERY_TIMEOUT;
    delete process.env.DB_TRANSACTION_TIMEOUT;
    delete process.env.LOG_LEVEL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isServerless", () => {
    it("should return true when in production with VERCEL_URL", () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL_URL = "my-app.vercel.app";
      expect(ServerlessConfig.isServerless()).toBe(true);
    });

    it("should return false when in production without VERCEL_URL", () => {
      process.env.NODE_ENV = "production";
      expect(ServerlessConfig.isServerless()).toBe(false);
    });

    it("should return false when not in production even with VERCEL_URL", () => {
      process.env.NODE_ENV = "development";
      process.env.VERCEL_URL = "my-app.vercel.app";
      expect(ServerlessConfig.isServerless()).toBe(false);
    });

    it("should return false in development environment", () => {
      process.env.NODE_ENV = "development";
      expect(ServerlessConfig.isServerless()).toBe(false);
    });
  });

  describe("isVercel", () => {
    it("should return true when VERCEL_URL is set", () => {
      process.env.VERCEL_URL = "my-app.vercel.app";
      expect(ServerlessConfig.isVercel()).toBe(true);
    });

    it("should return false when VERCEL_URL is not set", () => {
      delete process.env.VERCEL_URL;
      expect(ServerlessConfig.isVercel()).toBe(false);
    });

    it("should return true regardless of NODE_ENV when VERCEL_URL is set", () => {
      process.env.VERCEL_URL = "my-app.vercel.app";
      process.env.NODE_ENV = "development";
      expect(ServerlessConfig.isVercel()).toBe(true);
    });
  });

  describe("getDatabaseUrl", () => {
    it("should return DATABASE_URL when in serverless", () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL_URL = "my-app.vercel.app";
      process.env.DATABASE_URL = "postgres://serverless";
      expect(ServerlessConfig.getDatabaseUrl()).toBe("postgres://serverless");
    });

    it("should prefer DATABASE_URL over POSTGRES_PRISMA_URL in serverless", () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL_URL = "my-app.vercel.app";
      process.env.DATABASE_URL = "postgres://database_url";
      process.env.POSTGRES_PRISMA_URL = "postgres://prisma_url";
      expect(ServerlessConfig.getDatabaseUrl()).toBe("postgres://database_url");
    });

    it("should fallback to POSTGRES_PRISMA_URL when DATABASE_URL is not set in serverless", () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL_URL = "my-app.vercel.app";
      process.env.POSTGRES_PRISMA_URL = "postgres://prisma_url";
      expect(ServerlessConfig.getDatabaseUrl()).toBe("postgres://prisma_url");
    });

    it("should prefer DATABASE_URL_NON_POOLING in local development", () => {
      process.env.NODE_ENV = "development";
      process.env.DATABASE_URL_NON_POOLING = "postgres://non_pooling";
      process.env.DATABASE_URL = "postgres://pooled";
      expect(ServerlessConfig.getDatabaseUrl()).toBe("postgres://non_pooling");
    });

    it("should fallback to DATABASE_URL in local development when no non-pooling URL", () => {
      process.env.NODE_ENV = "development";
      process.env.DATABASE_URL = "postgres://pooled";
      expect(ServerlessConfig.getDatabaseUrl()).toBe("postgres://pooled");
    });

    it("should return empty string when no database URL is set", () => {
      expect(ServerlessConfig.getDatabaseUrl()).toBe("");
    });
  });

  describe("getConnectionPoolConfig", () => {
    it("should return smaller connection limits for serverless environment", () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL_URL = "my-app.vercel.app";

      const config = ServerlessConfig.getConnectionPoolConfig();

      expect(config.connectionLimit).toBe(5);
      expect(config.pool.max).toBe(5);
      expect(config.pool.min).toBe(0);
    });

    it("should return larger connection limits for non-serverless environment", () => {
      process.env.NODE_ENV = "development";

      const config = ServerlessConfig.getConnectionPoolConfig();

      expect(config.connectionLimit).toBe(10);
      expect(config.pool.max).toBe(10);
      expect(config.pool.min).toBe(2);
    });

    it("should have shorter idle timeout for serverless", () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL_URL = "my-app.vercel.app";

      const config = ServerlessConfig.getConnectionPoolConfig();

      expect(config.idleTimeout).toBe(30000);
      expect(config.pool.idleTimeoutMillis).toBe(30000);
    });

    it("should have longer idle timeout for non-serverless", () => {
      process.env.NODE_ENV = "development";

      const config = ServerlessConfig.getConnectionPoolConfig();

      expect(config.idleTimeout).toBe(60000);
      expect(config.pool.idleTimeoutMillis).toBe(60000);
    });

    it("should override pool min with DB_POOL_MIN env var", () => {
      process.env.DB_POOL_MIN = "3";

      const config = ServerlessConfig.getConnectionPoolConfig();

      expect(config.pool.min).toBe(3);
    });

    it("should override pool max with DB_POOL_MAX env var", () => {
      process.env.DB_POOL_MAX = "20";

      const config = ServerlessConfig.getConnectionPoolConfig();

      expect(config.pool.max).toBe(20);
    });

    it("should override acquire timeout with DB_POOL_ACQUIRE_TIMEOUT env var", () => {
      process.env.DB_POOL_ACQUIRE_TIMEOUT = "15000";

      const config = ServerlessConfig.getConnectionPoolConfig();

      expect(config.pool.acquireTimeoutMillis).toBe(15000);
    });

    it("should override idle timeout with DB_POOL_IDLE_TIMEOUT env var", () => {
      process.env.DB_POOL_IDLE_TIMEOUT = "45000";

      const config = ServerlessConfig.getConnectionPoolConfig();

      expect(config.pool.idleTimeoutMillis).toBe(45000);
    });

    it("should have maxLifetime configured", () => {
      const config = ServerlessConfig.getConnectionPoolConfig();

      expect(config.maxLifetime).toBeDefined();
      expect(config.maxLifetime).toBeGreaterThan(0);
    });

    it("should have serverless maxLifetime shorter than non-serverless", () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL_URL = "my-app.vercel.app";
      const serverlessConfig = ServerlessConfig.getConnectionPoolConfig();

      delete process.env.VERCEL_URL;
      process.env.NODE_ENV = "development";
      const normalConfig = ServerlessConfig.getConnectionPoolConfig();

      expect(serverlessConfig.maxLifetime).toBeLessThan(
        normalConfig.maxLifetime,
      );
    });
  });

  describe("getConfig", () => {
    it("should return complete serverless configuration when on Vercel", () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL_URL = "my-app.vercel.app";
      process.env.DATABASE_URL = "postgres://test";

      const config = ServerlessConfig.getConfig();

      expect(config.isServerless).toBe(true);
      expect(config.isVercel).toBe(true);
      expect(config.databaseUrl).toBe("postgres://test");
      expect(config.enableConnectionPooling).toBe(true);
      expect(config.connectionPool).toBeDefined();
    });

    it("should return non-serverless configuration in development", () => {
      process.env.NODE_ENV = "development";

      const config = ServerlessConfig.getConfig();

      expect(config.isServerless).toBe(false);
      expect(config.isVercel).toBe(false);
    });

    it("should set log level to error in serverless", () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL_URL = "my-app.vercel.app";

      const config = ServerlessConfig.getConfig();

      expect(config.logLevel).toBe("error");
    });

    it("should use LOG_LEVEL env var in non-serverless", () => {
      process.env.NODE_ENV = "development";
      process.env.LOG_LEVEL = "debug";

      const config = ServerlessConfig.getConfig();

      expect(config.logLevel).toBe("debug");
    });

    it("should default to info log level when LOG_LEVEL not set", () => {
      process.env.NODE_ENV = "development";

      const config = ServerlessConfig.getConfig();

      expect(config.logLevel).toBe("info");
    });

    it("should have shorter query timeout in serverless", () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL_URL = "my-app.vercel.app";

      const config = ServerlessConfig.getConfig();

      expect(config.queryTimeout).toBe(10000);
    });

    it("should have longer query timeout in non-serverless", () => {
      process.env.NODE_ENV = "development";

      const config = ServerlessConfig.getConfig();

      expect(config.queryTimeout).toBe(30000);
    });

    it("should override query timeout with DB_QUERY_TIMEOUT env var", () => {
      process.env.DB_QUERY_TIMEOUT = "5000";

      const config = ServerlessConfig.getConfig();

      expect(config.queryTimeout).toBe(5000);
    });

    it("should have shorter transaction timeout in serverless", () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL_URL = "my-app.vercel.app";

      const config = ServerlessConfig.getConfig();

      expect(config.transactionTimeout).toBe(15000);
    });

    it("should have longer transaction timeout in non-serverless", () => {
      process.env.NODE_ENV = "development";

      const config = ServerlessConfig.getConfig();

      expect(config.transactionTimeout).toBe(45000);
    });

    it("should override transaction timeout with DB_TRANSACTION_TIMEOUT env var", () => {
      process.env.DB_TRANSACTION_TIMEOUT = "20000";

      const config = ServerlessConfig.getConfig();

      expect(config.transactionTimeout).toBe(20000);
    });
  });

  describe("isVercel combined with isServerless", () => {
    it("should be on Vercel but not serverless in development", () => {
      process.env.NODE_ENV = "development";
      process.env.VERCEL_URL = "my-app.vercel.app";

      expect(ServerlessConfig.isVercel()).toBe(true);
      expect(ServerlessConfig.isServerless()).toBe(false);
    });

    it("should be both on Vercel and serverless in production", () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL_URL = "my-app.vercel.app";

      expect(ServerlessConfig.isVercel()).toBe(true);
      expect(ServerlessConfig.isServerless()).toBe(true);
    });
  });
});
