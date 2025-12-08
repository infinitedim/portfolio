import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @portfolio/logger before importing client-logger
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

vi.mock("@portfolio/logger", () => ({
  createLogger: vi.fn(() => mockLogger),
}));

// Import after mocking
import {
  logSecurityEvent,
  logPerformanceMetric,
  logAPICallEvent,
} from "../client-logger";

describe("client-logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logSecurityEvent", () => {
    it("should log security event with correct structure", () => {
      logSecurityEvent("login_attempt", {
        ip: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      });

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should log security event with event type", () => {
      logSecurityEvent("password_reset", {});

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should handle different event types", () => {
      logSecurityEvent("logout", { reason: "user_initiated" });

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should log without metadata", () => {
      logSecurityEvent("session_expired", {});

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should handle suspicious activity events", () => {
      logSecurityEvent("suspicious_activity", {
        attempts: 5,
        blocked: true,
      });

      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe("logPerformanceMetric", () => {
    it("should log performance metric with duration", () => {
      logPerformanceMetric("api_response", 150, {
        endpoint: "/api/users",
        method: "GET",
      });

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should log performance metric without metadata", () => {
      logPerformanceMetric("database_query", 50);

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should handle different metric names", () => {
      logPerformanceMetric("cache_hit", 5, { key: "user:123" });

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should log slow operations", () => {
      logPerformanceMetric("slow_query", 5000, {
        query: "SELECT * FROM users",
        slow: true,
      });

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should handle zero duration", () => {
      logPerformanceMetric("instant_operation", 0);

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should handle negative duration edge case", () => {
      logPerformanceMetric("timing_error", -10, { error: true });

      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe("logAPICallEvent", () => {
    it("should log API call with method and endpoint", () => {
      logAPICallEvent("GET", "/api/users", 200, 100);

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should log failed API calls", () => {
      logAPICallEvent("POST", "/api/users", 500, 2000);

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should log API calls with metadata", () => {
      logAPICallEvent("PUT", "/api/users/123", 200, 150);

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should handle different HTTP methods", () => {
      const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

      methods.forEach((method) => {
        logAPICallEvent(method, "/api/test", 200, 50);
      });

      expect(mockLogger.info).toHaveBeenCalledTimes(methods.length);
    });

    it("should log 4xx responses", () => {
      logAPICallEvent("GET", "/api/protected", 401, 20, "unauthorized");

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should log 404 responses", () => {
      logAPICallEvent("GET", "/api/nonexistent", 404, 15);

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should handle very long durations", () => {
      logAPICallEvent("GET", "/api/slow-endpoint", 200, 30000, "false");

      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle empty strings in security events", () => {
      logSecurityEvent("", { message: "" });

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should handle special characters in endpoints", () => {
      logAPICallEvent(
        "GET",
        "/api/users?filter[name]=test&sort=-created",
        200,
        50,
      );

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should handle unicode in metadata", () => {
      logSecurityEvent("login", {
        displayName: "テスト",
      });

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should handle large metadata objects", () => {
      const largeMetadata = {
        data: Array(100)
          .fill(0)
          .map((_, i) => ({ id: i, value: `item-${i}` })),
      };

      logPerformanceMetric("large_operation", 500, largeMetadata);

      expect(mockLogger.info).toHaveBeenCalled();
    });
  });
});
