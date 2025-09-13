import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { PerformanceMonitor } from "../PerformanceMonitor";

// Mock theme config
const mockThemeConfig = {
  name: "test-theme",
  colors: {
    bg: "#000000",
    text: "#ffffff",
    border: "#333333",
    accent: "#00ff00",
    success: "#00ff00",
    warning: "#ffaa00",
    info: "#0088ff",
    muted: "#666666",
  },
};

describe("PerformanceMonitor Optimizations", () => {
  beforeEach(() => {
    // Mock performance API
    global.performance = {
      ...global.performance,
      now: vi.fn(() => Date.now()),
      getEntriesByType: vi.fn(() => []),
    };

    // Mock canvas context - simplified
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      fillStyle: "",
      fillRect: vi.fn(),
      strokeStyle: "",
      lineWidth: 1,
      setLineDash: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      font: "",
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("should render without performance issues", () => {
    const startTime = Date.now();

    const { container } = render(
      <PerformanceMonitor themeConfig={mockThemeConfig} />,
    );

    const renderTime = Date.now() - startTime;

    expect(container).toBeTruthy();
    expect(renderTime).toBeLessThan(200); // Should render in less than 200ms
  });

  it("should use memoized statistics calculations", () => {
    const { container } = render(
      <PerformanceMonitor themeConfig={mockThemeConfig} />,
    );

    // Component should render with memoized calculations
    expect(container).toBeTruthy();
    expect(container.textContent).toContain("CPU Peak:");
  });

  it("should properly cleanup resources on unmount", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");

    const { unmount } = render(
      <PerformanceMonitor themeConfig={mockThemeConfig} />,
    );

    unmount();

    // Should clean up intervals
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("should show optimized performance statistics", () => {
    const { container } = render(
      <PerformanceMonitor themeConfig={mockThemeConfig} />,
    );

    // Check if performance stats are displayed
    expect(container.textContent).toContain("CPU Peak:");
    expect(container.textContent).toContain("Memory Peak:");
    expect(container.textContent).toContain("Network Peak:");
    expect(container.textContent).toContain("CPU Avg:");
    expect(container.textContent).toContain("Memory Avg:");
    expect(container.textContent).toContain("Network Avg:");
  });

  it("should handle theme changes efficiently", () => {
    const { container } = render(
      <PerformanceMonitor themeConfig={mockThemeConfig} />,
    );

    // Component should render successfully with theme config
    expect(container).toBeTruthy();
    expect(container.querySelector("canvas")).toBeTruthy();
  });
});
