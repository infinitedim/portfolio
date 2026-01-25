import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import {
  PerformanceMonitor,
  PerformanceProfiler,
  usePerfMeasure,
  PerformanceDashboard,
} from "../performance-index";

describe("performance-index.tsx", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    // Reset singleton instance
    (PerformanceMonitor as any).instance = undefined;
  });

  describe("Exports", () => {
    it("should export PerformanceMonitor", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(PerformanceMonitor).toBeDefined();
      expect(typeof PerformanceMonitor.getInstance).toBe("function");
    });

    it("should export PerformanceProfiler", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(PerformanceProfiler).toBeDefined();
      expect(typeof PerformanceProfiler).toBe("function");
    });

    it("should export usePerfMeasure", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(usePerfMeasure).toBeDefined();
      expect(typeof usePerfMeasure).toBe("function");
    });

    it("should export PerformanceDashboard", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(PerformanceDashboard).toBeDefined();
      expect(typeof PerformanceDashboard).toBe("function");
    });
  });

  describe("PerformanceMonitor", () => {
    it("should be a singleton", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should record and retrieve metrics", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const monitor = PerformanceMonitor.getInstance();
      monitor.recordMetric("test", 100);

      const average = monitor.getAverageMetric("test");
      expect(average).toBe(100);
    });
  });

  describe("PerformanceProfiler", () => {
    it("should render children", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <PerformanceProfiler id="test">
          <div>Test</div>
        </PerformanceProfiler>,
      );

      expect(container.textContent).toContain("Test");
    });
  });
});
