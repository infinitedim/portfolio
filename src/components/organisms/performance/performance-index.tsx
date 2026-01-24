"use client";

import { JSX, Profiler, ProfilerOnRenderCallback, ReactNode } from "react";

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    const values = this.metrics.get(name)!;
    if (values.length > 100) {
      values.splice(0, values.length - 100);
    }
  }

  public getAverageMetric(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  public getAllMetrics(): Record<
    string,
    { average: number; latest: number; count: number }
  > {
    const result: Record<
      string,
      { average: number; latest: number; count: number }
    > = {};

    this.metrics.forEach((values, name) => {
      result[name] = {
        average: this.getAverageMetric(name),
        latest: values[values.length - 1] || 0,
        count: values.length,
      };
    });

    return result;
  }

  public startMeasure(name: string): { end: () => number } {
    const startTime = performance.now();
    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.recordMetric(name, duration);
        return duration;
      },
    };
  }

  public logMetrics(): void {
    console.group("⚡ Performance Metrics");
    const metrics = this.getAllMetrics();
    Object.entries(metrics).forEach(([name, data]) => {
      console.log(
        `${name}: avg=${data.average.toFixed(2)}ms, latest=${data.latest.toFixed(2)}ms, count=${data.count}`,
      );
    });
    console.groupEnd();
  }
}

interface PerformanceProfilerProps {
  id: string;
  children: ReactNode;
  onRender?: (
    id: string,
    phase: "mount" | "update" | "nested-update",
    actualDuration: number,
  ) => void;
}

/**
 * Performance profiler component
 * @param {PerformanceProfilerProps} props - The component props.
 * @param {string} props.id - The ID of the profiler.
 * @param {ReactNode} props.children - The children of the profiler.
 * @param {ProfilerOnRenderCallback} props.onRender - The onRender callback.
 * @returns {JSX.Element} The rendered component.
 */
export function PerformanceProfiler({
  id,
  children,
  onRender,
}: PerformanceProfilerProps): JSX.Element {
  const performanceMonitor = PerformanceMonitor.getInstance();

  const handleRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
  ) => {
    performanceMonitor.recordMetric(`${id}-${phase}`, actualDuration);
    performanceMonitor.recordMetric(`${id}-base`, baseDuration);

    onRender?.(id, phase, actualDuration);

    if (process.env.NODE_ENV === "development" && actualDuration > 16) {
      console.warn(
        `🐌 Slow render detected: ${id} (${phase}) took ${actualDuration.toFixed(2)}ms`,
      );
    }
  };

  return (
    <Profiler
      id={id}
      onRender={handleRender}
    >
      {children}
    </Profiler>
  );
}

/**
 * Hook for measuring custom operations
 * @returns {object} An object containing:
 *   - startMeasure: Function to start a measure.
 *   - measureAsync: Function to measure an async operation.
 *   - getMetrics: Function to get the metrics.
 *   - logMetrics: Function to log the metrics.
 */
export function usePerfMeasure() {
  const performanceMonitor = PerformanceMonitor.getInstance();

  return {
    startMeasure: (name: string) => {
      const startTime = performance.now();

      return {
        end: () => {
          const duration = performance.now() - startTime;
          performanceMonitor.recordMetric(name, duration);
          return duration;
        },
      };
    },

    measureAsync: async <T,>(
      name: string,
      fn: () => Promise<T>,
    ): Promise<T> => {
      const measure = performanceMonitor.startMeasure(name);
      try {
        const result = await fn();
        measure.end();
        return result;
      } catch (error) {
        measure.end();
        throw error;
      }
    },

    getMetrics: () => performanceMonitor.getAllMetrics(),
    logMetrics: () => performanceMonitor.logMetrics(),
  };
}

export { PerformanceDashboard } from "@/components/organisms/performance/performance-dashboard";
