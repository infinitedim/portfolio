import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @portfolio/logger before importing logger
const mockServerLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const mockSecurityLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const mockPerformanceLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

vi.mock("@portfolio/logger", () => ({
  createLogger: vi.fn((name: string) => {
    if (name === "security") return mockSecurityLogger;
    if (name === "performance") return mockPerformanceLogger;
    return mockServerLogger;
  }),
}));

// Import after mocking
import {
  securityLogger,
  performanceLogger,
  log,
  logSecurity,
  logPerformance,
} from "../logger";

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logger instances", () => {
    describe("logger", () => {
      beforeEach(() => {
        vi.clearAllMocks();
      });

      describe("logger instances", () => {
        it("should export securityLogger", () => {
          expect(securityLogger).toBeDefined();
        });

        it("should export performanceLogger", () => {
          expect(performanceLogger).toBeDefined();
        });
      });

      describe("log.info", () => {
        it("should log info message", () => {
          log.info("Test info message");

          expect(mockServerLogger.info).toHaveBeenCalledWith(
            "Test info message",
          );
        });

        it("should log info with metadata", () => {
          log.info("Info with meta", { key: "value" });

          expect(mockServerLogger.info).toHaveBeenCalled();
        });
      });

      describe("log.warn", () => {
        it("should log warning message", () => {
          log.warning("Test warning message");

          expect(mockServerLogger.warn).toHaveBeenCalledWith(
            "Test warning message",
          );
        });

        it("should log warning with metadata", () => {
          log.warning("Warning with meta", { issue: "minor" });

          expect(mockServerLogger.warn).toHaveBeenCalled();
        });
      });

      describe("log.error", () => {
        it("should log error message", () => {
          log.error("Test error message");

          expect(mockServerLogger.error).toHaveBeenCalledWith(
            "Test error message",
          );
        });

        it("should log error with Error object", () => {
          const error = new Error("Something failed");
          log.error("Error occurred", { error });

          expect(mockServerLogger.error).toHaveBeenCalled();
        });

        it("should log error with metadata", () => {
          log.error("Error with meta", { errorCode: "ERR_001" });

          expect(mockServerLogger.error).toHaveBeenCalled();
        });
      });

      describe("log.debug", () => {
        it("should log debug message", () => {
          log.debug("Test debug message");

          expect(mockServerLogger.debug).toHaveBeenCalledWith(
            "Test debug message",
          );
        });

        it("should log debug with metadata", () => {
          log.debug("Debug with meta", { step: 1, total: 5 });

          expect(mockServerLogger.debug).toHaveBeenCalled();
        });
      });

      describe("logSecurity", () => {
        it("should log security info message", () => {
          logSecurity("info", { message: "User logged in" });

          expect(mockSecurityLogger.info).toHaveBeenCalledWith(
            "User logged in",
          );
        });

        it("should log security infowith user context", () => {
          logSecurity("info", { userId: "123", resource: "/admin" });

          expect(mockSecurityLogger.info).toHaveBeenCalled();
        });

        it("should log security warning", () => {
          logSecurity("warn", { message: "Suspicious activity detected" });

          expect(mockSecurityLogger.warn).toHaveBeenCalledWith(
            "Suspicious activity detected",
          );
        });

        it("should log security warning with details", () => {
          logSecurity("warn", {
            ip: "192.168.1.1",
            attempts: 5,
          });

          expect(mockSecurityLogger.warn).toHaveBeenCalled();
        });

        it("should log security error", () => {
          logSecurity("error", { message: "Security breach detected" });

          expect(mockSecurityLogger.error).toHaveBeenCalledWith(
            "Security breach detected",
          );
        });

        it("should log security error with incident details", () => {
          logSecurity("error", {
            ip: "10.0.0.1",
            targetResource: "/api/admin",
            blocked: true,
          });

          expect(mockSecurityLogger.error).toHaveBeenCalled();
        });
      });

      describe("logPerformance", () => {
        it("should log performance metric", () => {
          logPerformance("API response time", 150);

          expect(mockPerformanceLogger.info).toHaveBeenCalled();
        });

        it("should log performance with operation details", () => {
          logPerformance("Database query", 50, {
            table: "users",
            operation: "SELECT",
          });

          expect(mockPerformanceLogger.info).toHaveBeenCalled();
        });

        it("should log slow operations", () => {
          logPerformance("Slow query", 5000, {
            query: "SELECT * FROM large_table",
            rows: 100000,
          });

          expect(mockPerformanceLogger.info).toHaveBeenCalled();
        });

        it("should handle zero duration", () => {
          logPerformance("Instant operation", 0);

          expect(mockPerformanceLogger.info).toHaveBeenCalled();
        });
      });

      describe("edge cases", () => {
        it("should handle empty message", () => {
          log.info("");

          expect(mockServerLogger.info).toHaveBeenCalledWith("");
        });

        it("should handle null metadata", () => {
          log.info("Message", null as unknown as Record<string, unknown>);

          expect(mockServerLogger.info).toHaveBeenCalled();
        });

        it("should handle undefined metadata", () => {
          log.info("Message", undefined);

          expect(mockServerLogger.info).toHaveBeenCalled();
        });

        it("should handle complex nested metadata", () => {
          const complexMeta = {
            user: {
              id: "123",
              profile: {
                name: "Test",
                settings: {
                  theme: "dark",
                  notifications: true,
                },
              },
            },
            request: {
              headers: {
                "content-type": "application/json",
              },
            },
          };

          log.info("Complex log", complexMeta);

          expect(mockServerLogger.info).toHaveBeenCalled();
        });

        it("should handle circular reference in metadata gracefully", () => {
          const circular: Record<string, unknown> = { name: "test" };
          circular.self = circular;

          // This should not throw
          expect(() => log.info("Circular", circular)).not.toThrow();
        });

        it("should handle very long messages", () => {
          const longMessage = "A".repeat(10000);
          log.info(longMessage);

          expect(mockServerLogger.info).toHaveBeenCalledWith(longMessage);
        });

        it("should handle special characters in messages", () => {
          log.info("Message with special chars: \n\t\r\\\"'");

          expect(mockServerLogger.info).toHaveBeenCalled();
        });

        it("should handle unicode in messages", () => {
          log.info("Unicode message: 你好世界 🎉");

          expect(mockServerLogger.info).toHaveBeenCalled();
        });
      });

      describe("log levels", () => {
        it("should use correct log level for each function", () => {
          log.info("info");
          log.warning("warn");
          log.error("error");
          log.debug("debug");

          expect(mockServerLogger.info).toHaveBeenCalledTimes(1);
          expect(mockServerLogger.warn).toHaveBeenCalledTimes(1);
          expect(mockServerLogger.error).toHaveBeenCalledTimes(1);
          expect(mockServerLogger.debug).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
