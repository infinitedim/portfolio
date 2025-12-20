/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Performance monitoring and metrics collection system
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: "command" | "render" | "theme" | "font" | "history" | "system";
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalCommands: number;
    averageCommandTime: number;
    averageRenderTime: number;
    slowestCommand: { name: string; time: number };
    memoryUsage?: number;
    historySize: number;
  };
  recommendations: string[];
  generatedAt: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private startTimes: Map<string, number> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private isEnabled: boolean = true;
  private maxMetrics: number = 1000;

  private constructor() {
    this.setupPerformanceObserver();
    this.startSystemMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Enable or disable performance monitoring
   * @param {boolean} enabled - Whether to enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`Performance monitoring ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Start timing an operation
   * @param {string} name - The name of the operation
   * @param {PerformanceMetric["category"]} category - The category of the operation
   */
  startTiming(
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    category: PerformanceMetric["category"] = "system",
  ): void {
    if (!this.isEnabled) return;

    this.startTimes.set(name, performance.now());
  }

  /**
   * End timing an operation and record the metric
   * @param {string} name - The name of the operation
   * @param {PerformanceMetric["category"]} category - The category of the operation
   * @param {Record<string, any>} [metadata] - The metadata for the operation
   * @returns {number} The duration of the operation
   */
  endTiming(
    name: string,
    category: PerformanceMetric["category"] = "system",
    metadata?: Record<string, any>,
  ): number {
    if (!this.isEnabled) return 0;

    const startTime = this.startTimes.get(name);
    if (!startTime) {
      console.warn(`No start time found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(name);

    this.recordMetric(name, duration, category, metadata);
    return duration;
  }

  /**
   * Record a metric directly
   * @param {string} name - The name of the metric
   * @param {number} value - The value of the metric
   * @param {PerformanceMetric["category"]} category - The category of the metric
   * @param {Record<string, any>} metadata - The metadata for the metric
   */
  recordMetric(
    name: string,
    value: number,
    category: PerformanceMetric["category"],
    metadata?: Record<string, any>,
  ): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: performance.now(),
      category,
      metadata,
    };

    this.metrics.push(metric);

    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    if (value > 100) {
      console.warn(
        `Slow operation detected: ${name} took ${value.toFixed(2)}ms`,
        metadata,
      );
    }
  }

  /**
   * Measure command execution performance
   * @param {string} commandName - The name of the command
   * @param {() => Promise<T>} commandFn - The function to measure
   * @param {Record<string, any>} metadata - The metadata for the command
   * @returns {Promise<T>} The result of the command
   */
  measureCommand<T>(
    commandName: string,
    commandFn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    if (!this.isEnabled) return commandFn();

    this.startTiming(`command-${commandName}`, "command");

    return commandFn()
      .then((result) => {
        this.endTiming(`command-${commandName}`, "command", {
          ...metadata,
          success: true,
        });
        return result;
      })
      .catch((error) => {
        this.endTiming(`command-${commandName}`, "command", {
          ...metadata,
          success: false,
          error: (error as Error).message,
        });
        throw error;
      });
  }

  /**
   * Measure React component render time
   * @param {string} componentName - The name of the component
   * @param {() => void} renderFn - The function to measure
   */
  measureRender(componentName: string, renderFn: () => void): void {
    if (!this.isEnabled) {
      renderFn();
      return;
    }

    this.startTiming(`render-${componentName}`, "render");
    renderFn();
    this.endTiming(`render-${componentName}`, "render");
  }

  /**
   * Get performance report
   * @returns {PerformanceReport} The performance report
   */
  getReport(): PerformanceReport {
    const commandMetrics = this.metrics.filter((m) => m.category === "command");
    const renderMetrics = this.metrics.filter((m) => m.category === "render");

    const totalCommands = commandMetrics.length;
    const averageCommandTime =
      totalCommands > 0
        ? commandMetrics.reduce((sum, m) => sum + m.value, 0) / totalCommands
        : 0;

    const averageRenderTime =
      renderMetrics.length > 0
        ? renderMetrics.reduce((sum, m) => sum + m.value, 0) /
          renderMetrics.length
        : 0;

    const slowestCommand = commandMetrics.reduce(
      (slowest, current) =>
        current.value > slowest.time
          ? { name: current.name, time: current.value }
          : slowest,
      { name: "none", time: 0 },
    );

    const recommendations = this.generateRecommendations();

    return {
      metrics: [...this.metrics],
      summary: {
        totalCommands,
        averageCommandTime,
        averageRenderTime,
        slowestCommand,
        memoryUsage: this.getMemoryUsage(),
        historySize: this.getHistorySize(),
      },
      recommendations,
      generatedAt: Date.now(),
    };
  }

  /**
   * Get metrics by category
   * @param {PerformanceMetric["category"]} category - The category of the metrics
   * @returns {PerformanceMetric[]} The metrics by category
   */
  getMetricsByCategory(
    category: PerformanceMetric["category"],
  ): PerformanceMetric[] {
    return this.metrics.filter((m) => m.category === category);
  }

  /**
   * Clear all metrics
   * @returns {void}
   */
  clearMetrics(): void {
    this.metrics = [];
    this.startTimes.clear();
    console.log("Performance metrics cleared");
  }

  /**
   * Export metrics to JSON
   * @returns {string} The metrics in JSON format
   */
  exportMetrics(): string {
    const report = this.getReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * Setup Performance Observer for browser metrics
   * @returns {void}
   */
  private setupPerformanceObserver(): void {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === "measure") {
            this.recordMetric(entry.name, entry.duration, "system", {
              entryType: entry.entryType,
            });
          }
        });
      });

      observer.observe({ entryTypes: ["measure", "navigation"] });
    } catch (error) {
      console.warn("Failed to setup PerformanceObserver:", error);
    }
  }

  /**
   * Start monitoring system-level metrics
   * @returns {void}
   */
  private startSystemMonitoring(): void {
    if (typeof window === "undefined") return;

    const memoryInterval = setInterval(() => {
      const memoryUsage = this.getMemoryUsage();
      if (memoryUsage) {
        this.recordMetric("memory-usage", memoryUsage, "system");
      }
    }, 30000);

    const historyInterval = setInterval(() => {
      const historySize = this.getHistorySize();
      this.recordMetric("history-size", historySize, "history");
    }, 10000);

    this.intervals.set("memory-monitoring", memoryInterval);
    this.intervals.set("history-monitoring", historyInterval);
  }

  /**
   * Stop all monitoring and cleanup resources
   * @returns {void}
   */
  stopMonitoring(): void {
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();

    this.timeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.timeouts.clear();

    this.metrics.length = 0;
  }

  /**
   * Get current memory usage
   * @returns {number | undefined} The current memory usage
   */
  private getMemoryUsage(): number | undefined {
    if (
      typeof window !== "undefined" &&
      "performance" in window &&
      "memory" in performance
    ) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize;
    }
    return undefined;
  }

  /**
   * Get terminal history size
   * @returns {number} The terminal history size
   */
  private getHistorySize(): number {
    try {
      const historyData = localStorage.getItem("terminal-history");

      if (typeof historyData === "string" && historyData !== null) {
        const parsed = JSON.parse(historyData);

        if (typeof parsed === "object" && parsed !== null) {
          return (parsed as string[]).length;
        }
      }

      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Generate performance recommendations
   * @returns {string[]} The performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const report = this.getReport();

    if (report.summary.averageCommandTime > 200) {
      recommendations.push(
        "Consider optimizing slow commands - average execution time is high",
      );
    }

    if (report.summary.slowestCommand.time > 1000) {
      recommendations.push(
        `Command '${report.summary.slowestCommand.name}' is very slow (${report.summary.slowestCommand.time.toFixed(2)}ms)`,
      );
    }

    if (report.summary.averageRenderTime > 50) {
      recommendations.push(
        "Consider using React.memo or useMemo for expensive renders",
      );
    }

    if (
      report.summary.memoryUsage &&
      report.summary.memoryUsage > 50 * 1024 * 1024
    ) {
      recommendations.push(
        "High memory usage detected - consider clearing old history",
      );
    }

    if (report.summary.historySize > 1000) {
      recommendations.push(
        "Large history detected - consider using virtual scrolling",
      );
      recommendations.push(
        "Consider implementing history cleanup or archiving",
      );
    }

    const commandMetrics = this.getMetricsByCategory("command");
    const commandCounts = commandMetrics.reduce(
      (counts, metric) => {
        const command = metric.name.replace("command-", "");
        counts[command] = (counts[command] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>,
    );

    const mostUsedCommand = Object.entries(commandCounts).reduce(
      (most, [cmd, count]) =>
        count > most.count ? { command: cmd, count } : most,
      { command: "", count: 0 },
    );

    if (mostUsedCommand.count > 10 && mostUsedCommand.command) {
      recommendations.push(
        `Consider creating an alias for '${mostUsedCommand.command}' (used ${mostUsedCommand.count} times)`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Performance looks good! No recommendations at this time.",
      );
    }

    return recommendations;
  }
}

/**
 * Hook for React components
 * @returns {object} The performance monitor
 */
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  const measureRender = (componentName: string) => {
    return (renderFn: () => void) =>
      monitor.measureRender(componentName, renderFn);
  };

  const recordMetric = (
    name: string,
    value: number,
    category: PerformanceMetric["category"],
    metadata?: Record<string, any>,
  ): void => {
    monitor.recordMetric(name, value, category, metadata);
  };

  return {
    measureRender,
    recordMetric,
    startTiming: monitor.startTiming.bind(monitor),
    endTiming: monitor.endTiming.bind(monitor),
    getReport: monitor.getReport.bind(monitor),
    clearMetrics: monitor.clearMetrics.bind(monitor),
  };
}
