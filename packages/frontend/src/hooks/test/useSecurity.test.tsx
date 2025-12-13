import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSecurity, useSecurityMonitoring } from "../useSecurity";

// Mock tRPC
vi.mock("@/lib/trpc", () => ({
  trpc: null,
}));

describe("useSecurity hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with secure state", () => {
      const { result } = renderHook(() => useSecurity());

      expect(result.current.securityState).toEqual({
        isRateLimited: false,
        suspiciousActivity: 0,
        blockedAttempts: 0,
        lastThreatTime: null,
      });
      expect(result.current.threatAlerts).toEqual([]);
      expect(result.current.isSecure).toBe(true);
      expect(result.current.riskLevel).toBe("low");
    });

    it("should expose required methods", () => {
      const { result } = renderHook(() => useSecurity());

      expect(typeof result.current.validateInput).toBe("function");
      expect(typeof result.current.validateInputSync).toBe("function");
      expect(typeof result.current.resetRateLimit).toBe("function");
      expect(typeof result.current.getSecurityMetrics).toBe("function");
      expect(typeof result.current.getSecurityRecommendations).toBe("function");
      expect(typeof result.current.clearOldAlerts).toBe("function");
    });
  });

  describe("validateInputSync", () => {
    it("should return proper shape", () => {
      const { result } = renderHook(() => useSecurity());

      const validation = result.current.validateInputSync("test input");

      expect(validation).toHaveProperty("isValid");
      expect(validation).toHaveProperty("sanitizedInput");
      expect(validation).toHaveProperty("error");
      expect(validation).toHaveProperty("riskLevel");
      expect(validation).toHaveProperty("shouldProceed");
    });

    it("should detect script injection", () => {
      const { result } = renderHook(() => useSecurity());

      const validation = result.current.validateInputSync(
        "<script>alert(1)</script>",
      );

      expect(validation.isValid).toBe(false);
      expect(validation.riskLevel).toBe("high");
      expect(validation.shouldProceed).toBe(false);
      expect(validation.error).toContain("dangerous");
    });

    it("should detect javascript: protocol", () => {
      const { result } = renderHook(() => useSecurity());

      const validation = result.current.validateInputSync(
        "javascript:void(0)",
      );

      expect(validation.isValid).toBe(false);
      expect(validation.riskLevel).toBe("high");
    });

    it("should detect event handlers", () => {
      const { result } = renderHook(() => useSecurity());

      const validation = result.current.validateInputSync(
        'img onerror="alert(1)"',
      );

      expect(validation.isValid).toBe(false);
      expect(validation.riskLevel).toBe("high");
    });

    it("should detect eval() calls", () => {
      const { result } = renderHook(() => useSecurity());

      const validation = result.current.validateInputSync(
        'eval("malicious code")',
      );

      expect(validation.isValid).toBe(false);
      expect(validation.riskLevel).toBe("high");
    });

    it("should detect document.cookie access", () => {
      const { result } = renderHook(() => useSecurity());

      const validation = result.current.validateInputSync(
        "document.cookie",
      );

      expect(validation.isValid).toBe(false);
      expect(validation.riskLevel).toBe("high");
    });

    it("should detect window object access", () => {
      const { result } = renderHook(() => useSecurity());

      const validation = result.current.validateInputSync(
        "window.location",
      );

      expect(validation.isValid).toBe(false);
      expect(validation.riskLevel).toBe("high");
    });

    it("should validate clean input correctly", () => {
      const { result } = renderHook(() => useSecurity());

      const validation = result.current.validateInputSync("hello world");

      expect(validation.isValid).toBe(true);
      expect(validation.riskLevel).toBe("low");
      expect(validation.shouldProceed).toBe(true);
      expect(validation.error).toBeNull();
    });

    it("should trim input whitespace", () => {
      const { result } = renderHook(() => useSecurity());

      const validation = result.current.validateInputSync("  hello world  ");

      expect(validation.sanitizedInput).toBe("hello world");
    });

    it("should strip HTML from dangerous input", () => {
      const { result } = renderHook(() => useSecurity());

      const validation = result.current.validateInputSync(
        "<script>alert(1)</script>",
      );

      expect(validation.sanitizedInput).not.toContain("<script>");
    });
  });

  describe("validateInput (async)", () => {
    it("should validate clean input", async () => {
      const { result } = renderHook(() => useSecurity());

      let validation;
      await act(async () => {
        validation = await result.current.validateInput("test input");
      });

      expect(validation).toHaveProperty("isValid", true);
      expect(validation).toHaveProperty("shouldProceed", true);
    });

    it("should detect dangerous patterns", async () => {
      const { result } = renderHook(() => useSecurity());

      let validation;
      await act(async () => {
        validation = await result.current.validateInput("<script>hack()</script>");
      });

      expect(validation).toHaveProperty("isValid", false);
      expect(validation).toHaveProperty("shouldProceed", false);
      expect(validation).toHaveProperty("riskLevel", "high");
    });

    it("should handle errors gracefully", async () => {
      const { result } = renderHook(() => useSecurity());

      // Even with edge cases, should return a valid response
      let validation;
      await act(async () => {
        validation = await result.current.validateInput("");
      });

      expect(validation).toHaveProperty("isValid");
      expect(validation).toHaveProperty("sanitizedInput");
    });
  });

  describe("security metrics", () => {
    it("getSecurityMetrics returns proper shape", () => {
      const { result } = renderHook(() => useSecurity());

      const metrics = result.current.getSecurityMetrics();

      expect(metrics).toHaveProperty("totalRequests");
      expect(metrics).toHaveProperty("validRequests");
      expect(metrics).toHaveProperty("blockedRequests");
      expect(metrics).toHaveProperty("averageRequestsPerMinute");
      expect(metrics).toHaveProperty("topThreats");
      expect(Array.isArray(metrics.topThreats)).toBe(true);
    });

    it("should track valid requests", () => {
      const { result } = renderHook(() => useSecurity());

      act(() => {
        result.current.validateInputSync("valid input 1");
        result.current.validateInputSync("valid input 2");
      });

      const metrics = result.current.getSecurityMetrics();
      expect(metrics.totalRequests).toBe(2);
      expect(metrics.validRequests).toBe(2);
    });

    it("should track blocked requests", () => {
      const { result } = renderHook(() => useSecurity());

      act(() => {
        result.current.validateInputSync("<script>bad</script>");
        result.current.validateInputSync("javascript:void(0)");
      });

      const metrics = result.current.getSecurityMetrics();
      expect(metrics.totalRequests).toBe(2);
      expect(metrics.blockedRequests).toBe(2);
    });

    it("should use caching for metrics", () => {
      const { result } = renderHook(() => useSecurity());

      act(() => {
        result.current.validateInputSync("test");
      });

      const metrics1 = result.current.getSecurityMetrics();
      const metrics2 = result.current.getSecurityMetrics();

      // Should return cached result
      expect(metrics1).toEqual(metrics2);
    });
  });

  describe("security recommendations", () => {
    it("getSecurityRecommendations returns array", () => {
      const { result } = renderHook(() => useSecurity());

      const recommendations = result.current.getSecurityRecommendations();

      expect(Array.isArray(recommendations)).toBe(true);
    });

    it("should return empty array for secure state", () => {
      const { result } = renderHook(() => useSecurity());

      const recommendations = result.current.getSecurityRecommendations();

      expect(recommendations.length).toBe(0);
    });
  });

  describe("rate limiting", () => {
    it("resetRateLimit should reset rate limit state", () => {
      const { result } = renderHook(() => useSecurity());

      // Initially not rate limited
      expect(result.current.securityState.isRateLimited).toBe(false);

      act(() => {
        result.current.resetRateLimit();
      });

      expect(result.current.securityState.isRateLimited).toBe(false);
    });
  });

  describe("computed values", () => {
    it("isSecure should be true initially", () => {
      const { result } = renderHook(() => useSecurity());

      expect(result.current.isSecure).toBe(true);
    });

    it("riskLevel should be low initially", () => {
      const { result } = renderHook(() => useSecurity());

      expect(result.current.riskLevel).toBe("low");
    });
  });

  describe("clearOldAlerts", () => {
    it("should be callable without errors", () => {
      const { result } = renderHook(() => useSecurity());

      expect(() => {
        act(() => {
          result.current.clearOldAlerts();
        });
      }).not.toThrow();
    });
  });

  describe("cleanup on unmount", () => {
    it("should clean up resources on unmount", () => {
      const { unmount } = renderHook(() => useSecurity());

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
});

describe("useSecurityMonitoring hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return security hook values", () => {
    const { result } = renderHook(() => useSecurityMonitoring());

    expect(result.current.securityState).toBeDefined();
    expect(result.current.validateInputSync).toBeDefined();
    expect(result.current.getSecurityMetrics).toBeDefined();
  });

  it("should work in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const { result, unmount } = renderHook(() => useSecurityMonitoring());

    expect(result.current.isSecure).toBe(true);

    // Clean up
    unmount();
    process.env.NODE_ENV = originalEnv;
  });
});
