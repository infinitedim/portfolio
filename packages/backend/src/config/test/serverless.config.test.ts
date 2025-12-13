import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ServerlessConfig } from "../serverless.config";

describe("ServerlessConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
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
    it("should always return false (no longer using serverless deployment)", () => {
      process.env.NODE_ENV = "production";
      expect(ServerlessConfig.isServerless()).toBe(false);
    });

    it("should return false in development environment", () => {
      process.env.NODE_ENV = "development";
      expect(ServerlessConfig.isServerless()).toBe(false);
    });

    it("should return false in test environment", () => {
      process.env.NODE_ENV = "test";
      expect(ServerlessConfig.isServerless()).toBe(false);
    });
  });

  describe("getDatabaseUrl", () => {
    it("should return DATABASE_URL when set", () => {
      process.env.DATABASE_URL = "postgres://mydb";
      expect(ServerlessConfig.getDatabaseUrl()).toBe("postgres://mydb");
    });

    it("should return empty string when no database URL is set", () => {
      expect(ServerlessConfig.getDatabaseUrl()).toBe("");
    });
  });

  describe("getConnectionPoolConfig", () => {
    it("should return standard connection limits", () => {
      const config = ServerlessConfig.getConnectionPoolConfig();

      expect(config.connectionLimit).toBe(10);
      expect(config.pool.max).toBe(10);
      expect(config.pool.min).toBe(2);
    });

    it("should have standard idle timeout", () => {
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
  });

  describe("getConfig", () => {
    it("should return non-serverless configuration", () => {
      process.env.DATABASE_URL = "postgres://test";

      const config = ServerlessConfig.getConfig();

      expect(config.isServerless).toBe(false);
      expect(config.databaseUrl).toBe("postgres://test");
      expect(config.enableConnectionPooling).toBe(true);
      expect(config.connectionPool).toBeDefined();
    });

    it("should use LOG_LEVEL env var", () => {
      process.env.LOG_LEVEL = "debug";

      const config = ServerlessConfig.getConfig();

      expect(config.logLevel).toBe("debug");
    });

    it("should default to info log level when LOG_LEVEL not set", () => {
      const config = ServerlessConfig.getConfig();

      expect(config.logLevel).toBe("info");
    });

    it("should have standard query timeout", () => {
      const config = ServerlessConfig.getConfig();

      expect(config.queryTimeout).toBe(30000);
    });

    it("should override query timeout with DB_QUERY_TIMEOUT env var", () => {
      process.env.DB_QUERY_TIMEOUT = "5000";

      const config = ServerlessConfig.getConfig();

      expect(config.queryTimeout).toBe(5000);
    });

    it("should have standard transaction timeout", () => {
      const config = ServerlessConfig.getConfig();

      expect(config.transactionTimeout).toBe(45000);
    });

    it("should override transaction timeout with DB_TRANSACTION_TIMEOUT env var", () => {
      process.env.DB_TRANSACTION_TIMEOUT = "20000";

      const config = ServerlessConfig.getConfig();

      expect(config.transactionTimeout).toBe(20000);
    });
  });
});
