import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  logger,
  securityLogger,
  authLogger,
  dbLogger,
  apiLogger,
  cacheLogger,
  serverlessLog,
} from "../logger";

// Mock winston
vi.mock("winston", () => {
  const mockLogger = {
    child: vi.fn().mockReturnThis(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  return {
    default: {
      createLogger: vi.fn().mockReturnValue(mockLogger),
      format: {
        combine: vi.fn(),
        timestamp: vi.fn(),
        printf: vi.fn(),
        colorize: vi.fn(),
        errors: vi.fn(),
      },
      transports: {
        Console: vi.fn(),
      },
    },
  };
});

describe("Logger Utilities", () => {
  const originalEnv = process.env;
  const originalConsole = console;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      LOG_LEVEL: "info",
      NODE_ENV: "test",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    console = originalConsole;
  });

  describe("logger", () => {
    it("should export winston logger", () => {
      expect(logger).toBeDefined();
      expect(logger).toHaveProperty("info");
      expect(logger).toHaveProperty("warn");
      expect(logger).toHaveProperty("error");
    });
  });

  describe("specialized loggers", () => {
    it("should export securityLogger", () => {
      expect(securityLogger).toBeDefined();
    });

    it("should export authLogger", () => {
      expect(authLogger).toBeDefined();
    });

    it("should export dbLogger", () => {
      expect(dbLogger).toBeDefined();
    });

    it("should export apiLogger", () => {
      expect(apiLogger).toBeDefined();
    });

    it("should export cacheLogger", () => {
      expect(cacheLogger).toBeDefined();
    });
  });

  describe("serverlessLog", () => {
    it("should have info method", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      serverlessLog.info("test message");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should have warn method", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      serverlessLog.warn("test warning");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should have error method", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      serverlessLog.error("test error");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should have debug method that only logs in development", () => {
      const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      process.env.NODE_ENV = "development";
      serverlessLog.debug("test debug");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should not log debug in production", () => {
      const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      process.env.NODE_ENV = "production";
      serverlessLog.debug("test debug");

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should include context in log messages", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      serverlessLog.info("test message", { key: "value" });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        expect.stringContaining("value"),
      );
      consoleSpy.mockRestore();
    });
  });
});

