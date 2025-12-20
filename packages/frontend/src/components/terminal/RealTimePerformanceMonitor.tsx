"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";

/**
 * Performance metrics data structure
 * @interface PerformanceMetrics
 * @property {number} responseTime - Response time in milliseconds
 * @property {number} cacheHitRate - Cache hit rate percentage
 * @property {number} suggestionAccuracy - Suggestion accuracy percentage
 * @property {number} typingSpeed - Typing speed in characters per second
 * @property {number} queriesPerSecond - Queries processed per second
 * @property {number} memoryUsage - Memory usage in MB
 * @property {number} renderTime - Render time in milliseconds
 * @property {number} streamingLatency - Streaming latency in milliseconds
 */
interface PerformanceMetrics {
  responseTime: number;
  cacheHitRate: number;
  suggestionAccuracy: number;
  typingSpeed: number;
  queriesPerSecond: number;
  memoryUsage: number;
  renderTime: number;
  streamingLatency: number;
}

/**
 * Props for the RealTimePerformanceMonitor component
 * @interface PerformanceMonitorProps
 * @property {PerformanceMetrics} metrics - Current performance metrics
 * @property {boolean} isActive - Whether monitor is active
 * @property {(active: boolean) => void} [onToggle] - Toggle callback
 * @property {string} [className] - Additional CSS classes
 */
interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  isActive: boolean;
  onToggle?: (active: boolean) => void;
  className?: string;
}

/**
 * Real-time performance monitoring component
 * Displays live performance metrics with history tracking and grading
 * @param {PerformanceMonitorProps} props - Component props
 * @param {PerformanceMetrics} props.metrics - Current metrics
 * @param {boolean} props.isActive - Active state
 * @param {(active: boolean) => void} [props.onToggle] - Toggle callback
 * @param {string} [props.className] - Additional classes
 * @returns {JSX.Element} The performance monitor component
 * @example
 * ```tsx
 * <RealTimePerformanceMonitor
 *   metrics={currentMetrics}
 *   isActive={true}
 *   onToggle={handleToggle}
 * />
 * ```
 */
export function RealTimePerformanceMonitor({
  metrics,
  isActive,
  onToggle,
  className = "",
}: PerformanceMonitorProps) {
  const { themeConfig } = useTheme();
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const historyRef = useRef<PerformanceMetrics[]>([]);

  useEffect(() => {
    if (isActive) {
      const newHistory = [...historyRef.current, metrics].slice(-60);
      historyRef.current = newHistory;
      setHistory(newHistory);
    }
  }, [metrics, isActive]);

  const getMetricColor = (
    value: number,
    thresholds: { good: number; warning: number },
  ) => {
    if (value <= thresholds.good)
      return themeConfig.colors.success || "#10B981";
    if (value <= thresholds.warning)
      return themeConfig.colors.warning || "#F59E0B";
    return themeConfig.colors.error || "#EF4444";
  };

  const getPerformanceGrade = () => {
    const scores = [
      metrics.responseTime <= 50
        ? 100
        : Math.max(0, 100 - (metrics.responseTime - 50) * 2),
      metrics.cacheHitRate,
      metrics.suggestionAccuracy,
      metrics.renderTime <= 16
        ? 100
        : Math.max(0, 100 - (metrics.renderTime - 16) * 5),
    ];

    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;

    if (average >= 90)
      return { grade: "A+", color: themeConfig.colors.success };
    if (average >= 80) return { grade: "A", color: themeConfig.colors.success };
    if (average >= 70) return { grade: "B", color: themeConfig.colors.warning };
    if (average >= 60) return { grade: "C", color: themeConfig.colors.warning };
    return { grade: "D", color: themeConfig.colors.error };
  };

  const performanceGrade = getPerformanceGrade();

  if (!isActive) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 hover:scale-105 ${className}`}
        style={{
          backgroundColor: `${themeConfig.colors.accent}10`,
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.muted,
        }}
      >
        📊 Performance Monitor
      </button>
    );
  }

  return (
    <div
      className={`bg-opacity-95 backdrop-blur-sm border rounded-lg shadow-lg transition-all duration-300 ${isExpanded ? "w-80" : "w-64"} ${className}`}
      style={{
        backgroundColor: themeConfig.colors.bg,
        borderColor: themeConfig.colors.border,
      }}
    >
      { }
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{
          backgroundColor: `${themeConfig.colors.accent}08`,
          borderColor: themeConfig.colors.border,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium"
            style={{ color: themeConfig.colors.text }}
          >
            📊 Performance Monitor
          </span>
          <span
            className="text-xs px-2 py-1 rounded-full font-bold"
            style={{
              backgroundColor: `${performanceGrade.color}20`,
              color: performanceGrade.color,
            }}
          >
            {performanceGrade.grade}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs px-2 py-1 rounded hover:bg-opacity-20 transition-colors"
            style={{ color: themeConfig.colors.muted }}
          >
            {isExpanded ? "📐" : "📏"}
          </button>
          <button
            onClick={() => onToggle?.(false)}
            className="text-xs px-2 py-1 rounded hover:bg-opacity-20 transition-colors"
            style={{ color: themeConfig.colors.muted }}
          >
            ✕
          </button>
        </div>
      </div>

      { }
      <div className="p-4 space-y-3">
        { }
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-medium"
            style={{ color: themeConfig.colors.muted }}
          >
            Response Time
          </span>
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-mono"
              style={{
                color: getMetricColor(metrics.responseTime, {
                  good: 50,
                  warning: 100,
                }),
              }}
            >
              {Math.round(metrics.responseTime)}ms
            </span>
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: getMetricColor(metrics.responseTime, {
                  good: 50,
                  warning: 100,
                }),
              }}
            />
          </div>
        </div>

        { }
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-medium"
            style={{ color: themeConfig.colors.muted }}
          >
            Cache Hit Rate
          </span>
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-mono"
              style={{
                color: getMetricColor(100 - metrics.cacheHitRate, {
                  good: 20,
                  warning: 50,
                }),
              }}
            >
              {Math.round(metrics.cacheHitRate)}%
            </span>
            <div
              className="w-12 h-1.5 bg-opacity-20 rounded-full overflow-hidden"
              style={{ backgroundColor: themeConfig.colors.muted }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${metrics.cacheHitRate}%`,
                  backgroundColor: getMetricColor(100 - metrics.cacheHitRate, {
                    good: 20,
                    warning: 50,
                  }),
                }}
              />
            </div>
          </div>
        </div>

        { }
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-medium"
            style={{ color: themeConfig.colors.muted }}
          >
            Suggestion Accuracy
          </span>
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-mono"
              style={{
                color: getMetricColor(100 - metrics.suggestionAccuracy, {
                  good: 10,
                  warning: 25,
                }),
              }}
            >
              {Math.round(metrics.suggestionAccuracy)}%
            </span>
          </div>
        </div>

        { }
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-medium"
            style={{ color: themeConfig.colors.muted }}
          >
            Typing Speed
          </span>
          <span
            className="text-sm font-mono"
            style={{ color: themeConfig.colors.text }}
          >
            {Math.round(metrics.typingSpeed)} cps
          </span>
        </div>

        {isExpanded && (
          <>
            { }
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-medium"
                style={{ color: themeConfig.colors.muted }}
              >
                Render Time
              </span>
              <span
                className="text-sm font-mono"
                style={{
                  color: getMetricColor(metrics.renderTime, {
                    good: 16,
                    warning: 33,
                  }),
                }}
              >
                {Math.round(metrics.renderTime)}ms
              </span>
            </div>

            { }
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-medium"
                style={{ color: themeConfig.colors.muted }}
              >
                Queries/sec
              </span>
              <span
                className="text-sm font-mono"
                style={{ color: themeConfig.colors.text }}
              >
                {Math.round(metrics.queriesPerSecond)}
              </span>
            </div>

            { }
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-medium"
                style={{ color: themeConfig.colors.muted }}
              >
                Streaming Latency
              </span>
              <span
                className="text-sm font-mono"
                style={{
                  color: getMetricColor(metrics.streamingLatency, {
                    good: 100,
                    warning: 250,
                  }),
                }}
              >
                {Math.round(metrics.streamingLatency)}ms
              </span>
            </div>
          </>
        )}
      </div>
      {isExpanded && history.length > 10 && (
        <div className="px-4 pb-4">
          <div
            className="text-xs font-medium mb-2"
            style={{ color: themeConfig.colors.muted }}
          >
            Response Time Trend
          </div>
          <div className="h-16 flex items-end gap-1">
            {history.slice(-20).map((point, index) => {
              const height = Math.max(
                2,
                (point.responseTime /
                  Math.max(...history.map((h) => h.responseTime))) *
                64,
              );
              return (
                <div
                  key={index}
                  className="flex-1 rounded-t transition-all duration-300"
                  style={{
                    height: `${height}px`,
                    backgroundColor: getMetricColor(point.responseTime, {
                      good: 50,
                      warning: 100,
                    }),
                    opacity: 0.7 + (index / 20) * 0.3,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      { }
      <div
        className="px-4 py-2 text-xs border-t"
        style={{
          backgroundColor: `${themeConfig.colors.muted}05`,
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.muted,
        }}
      >
        <div className="flex items-center justify-between">
          <span>🔄 Real-time monitoring</span>
          <span>{history.length} samples</span>
        </div>
      </div>
    </div>
  );
}
