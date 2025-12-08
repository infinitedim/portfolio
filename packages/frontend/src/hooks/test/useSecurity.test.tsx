import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSecurity } from "../useSecurity";

// Mock tRPC
vi.mock("@/lib/trpc", () => ({
  trpc: null,
}));

describe("useSecurity hook", () => {
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

  it("validateInputSync should return proper shape", () => {
    const { result } = renderHook(() => useSecurity());

    const validation = result.current.validateInputSync("test input");

    expect(validation).toHaveProperty("isValid");
    expect(validation).toHaveProperty("sanitizedInput");
    expect(validation).toHaveProperty("error");
    expect(validation).toHaveProperty("riskLevel");
    expect(validation).toHaveProperty("shouldProceed");
  });

  it("should detect dangerous input patterns", () => {
    const { result } = renderHook(() => useSecurity());

    const validation = result.current.validateInputSync(
      "<script>alert(1)</script>",
    );

    expect(validation.isValid).toBe(false);
    expect(validation.riskLevel).toBe("high");
    expect(validation.shouldProceed).toBe(false);
  });

  it("should validate clean input correctly", () => {
    const { result } = renderHook(() => useSecurity());

    const validation = result.current.validateInputSync("hello world");

    expect(validation.isValid).toBe(true);
    expect(validation.riskLevel).toBe("low");
    expect(validation.shouldProceed).toBe(true);
  });

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

  it("getSecurityRecommendations returns array", () => {
    const { result } = renderHook(() => useSecurity());

    const recommendations = result.current.getSecurityRecommendations();

    expect(Array.isArray(recommendations)).toBe(true);
  });
});
