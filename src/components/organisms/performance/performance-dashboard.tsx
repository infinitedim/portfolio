"use client";

import { useState, useEffect, type JSX } from "react";
import { useTheme } from "@/hooks/use-theme";
import { PerformanceMonitor } from "@/lib/performance/performance-monitor";

interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Performance dashboard component
 * @param {PerformanceDashboardProps} props - The props for the PerformanceDashboard component
 * @param {boolean} props.isOpen - Whether the dashboard is open
 * @param {() => void} props.onClose - The function to close the dashboard
 * @returns {JSX.Element | null} The PerformanceDashboard component
 */
export function PerformanceDashboard({
  isOpen,
  onClose,
}: PerformanceDashboardProps): JSX.Element | null {
  const { themeConfig } = useTheme();
  const [report, setReport] = useState(
    PerformanceMonitor.getInstance().getReport(),
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh || !isOpen) return;

    const interval = setInterval(() => {
      setReport(PerformanceMonitor.getInstance().getReport());
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setReport(PerformanceMonitor.getInstance().getReport());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (ms: number): string => {
    if (ms < 1) return `${ms.toFixed(2)}ms`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  const getMetricsByCategory = () => {
    if (selectedCategory === "all") return report.metrics;
    return report.metrics.filter((m) => m.category === selectedCategory);
  };

  const getPerformanceColor = (
    value: number,
    thresholds: { good: number; warning: number },
  ): string => {
    if (value <= thresholds.good)
      return themeConfig.colors.success || themeConfig.colors.accent;
    if (value <= thresholds.warning)
      return themeConfig.colors.warning || "#fbbf24";
    return themeConfig.colors.error || "#ef4444";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: `${themeConfig.colors.bg}cc` }}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] rounded-lg border shadow-xl overflow-hidden"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.text,
        }}
      >
        {}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div>
            <h2
              className="text-xl font-bold"
              style={{ color: themeConfig.colors.accent }}
            >
              📊 Performance Dashboard
            </h2>
            <p className="text-sm opacity-75 mt-1">
              Monitor app performance and get optimization recommendations
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto refresh
            </label>

            <button
              onClick={() =>
                setReport(PerformanceMonitor.getInstance().getReport())
              }
              className="px-3 py-1 rounded text-sm hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: `${themeConfig.colors.accent}20`,
                color: themeConfig.colors.accent,
                border: `1px solid ${themeConfig.colors.accent}`,
              }}
            >
              🔄 Refresh
            </button>

            <button
              onClick={onClose}
              className="text-xl hover:opacity-80 transition-opacity"
              style={{ color: themeConfig.colors.text }}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-100px)]">
          {}
          <div
            className="w-48 border-r p-4 overflow-y-auto"
            style={{ borderColor: themeConfig.colors.border }}
          >
            <h3
              className="font-semibold mb-3"
              style={{ color: themeConfig.colors.accent }}
            >
              Categories
            </h3>
            <div className="space-y-1">
              {[
                "all",
                "command",
                "render",
                "theme",
                "font",
                "history",
                "system",
              ].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-all duration-200 ${
                    selectedCategory === category ? "font-medium" : ""
                  }`}
                  style={{
                    backgroundColor:
                      selectedCategory === category
                        ? `${themeConfig.colors.accent}20`
                        : "transparent",
                    color:
                      selectedCategory === category
                        ? themeConfig.colors.accent
                        : themeConfig.colors.text,
                  }}
                >
                  {category === "all" ? "📊 All Metrics" : `📈 ${category}`}
                </button>
              ))}
            </div>

            {}
            <div className="mt-6">
              <h3
                className="font-semibold mb-3"
                style={{ color: themeConfig.colors.accent }}
              >
                Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    PerformanceMonitor.getInstance().clearMetrics();
                    setReport(PerformanceMonitor.getInstance().getReport());
                  }}
                  className="w-full px-3 py-2 rounded text-sm hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: `${themeConfig.colors.error || themeConfig.colors.accent}20`,
                    color:
                      themeConfig.colors.error || themeConfig.colors.accent,
                    border: `1px solid ${themeConfig.colors.error || themeConfig.colors.accent}`,
                  }}
                >
                  🗑️ Clear Metrics
                </button>

                <button
                  onClick={() => {
                    const dataStr =
                      PerformanceMonitor.getInstance().exportMetrics();
                    const dataUri =
                      "data:application/json;charset=utf-8," +
                      encodeURIComponent(dataStr);
                    const exportFileDefaultName = `performance-report-${new Date().toISOString().slice(0, 10)}.json`;
                    const linkElement = document.createElement("a");
                    linkElement.setAttribute("href", dataUri);
                    linkElement.setAttribute("download", exportFileDefaultName);
                    linkElement.click();
                  }}
                  className="w-full px-3 py-2 rounded text-sm hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: `${themeConfig.colors.accent}20`,
                    color: themeConfig.colors.accent,
                    border: `1px solid ${themeConfig.colors.accent}`,
                  }}
                >
                  💾 Export Data
                </button>
              </div>
            </div>
          </div>

          {}
          <div className="flex-1 p-6 overflow-y-auto">
            {}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div
                className="p-4 rounded border"
                style={{
                  backgroundColor: `${themeConfig.colors.accent}10`,
                  borderColor: themeConfig.colors.border,
                }}
              >
                <div className="text-sm opacity-75">Total Commands</div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: themeConfig.colors.accent }}
                >
                  {report.summary.totalCommands}
                </div>
              </div>

              <div
                className="p-4 rounded border"
                style={{
                  backgroundColor: `${themeConfig.colors.accent}10`,
                  borderColor: themeConfig.colors.border,
                }}
              >
                <div className="text-sm opacity-75">Avg Command Time</div>
                <div
                  className="text-2xl font-bold"
                  style={{
                    color: getPerformanceColor(
                      report.summary.averageCommandTime,
                      { good: 50, warning: 200 },
                    ),
                  }}
                >
                  {formatTime(report.summary.averageCommandTime)}
                </div>
              </div>

              <div
                className="p-4 rounded border"
                style={{
                  backgroundColor: `${themeConfig.colors.accent}10`,
                  borderColor: themeConfig.colors.border,
                }}
              >
                <div className="text-sm opacity-75">Avg Render Time</div>
                <div
                  className="text-2xl font-bold"
                  style={{
                    color: getPerformanceColor(
                      report.summary.averageRenderTime,
                      { good: 16, warning: 50 },
                    ),
                  }}
                >
                  {formatTime(report.summary.averageRenderTime)}
                </div>
              </div>

              <div
                className="p-4 rounded border"
                style={{
                  backgroundColor: `${themeConfig.colors.accent}10`,
                  borderColor: themeConfig.colors.border,
                }}
              >
                <div className="text-sm opacity-75">Memory Usage</div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: themeConfig.colors.accent }}
                >
                  {report.summary.memoryUsage
                    ? formatBytes(report.summary.memoryUsage)
                    : "N/A"}
                </div>
              </div>
            </div>

            {}
            {report.recommendations.length > 0 && (
              <div className="mb-6">
                <h3
                  className="font-semibold mb-3"
                  style={{ color: themeConfig.colors.accent }}
                >
                  💡 Recommendations
                </h3>
                <div className="space-y-2">
                  {report.recommendations.map((recommendation, index) => (
                    <div
                      key={index}
                      className="p-3 rounded border-l-4 text-sm"
                      style={{
                        backgroundColor: `${themeConfig.colors.accent}10`,
                        borderLeftColor: themeConfig.colors.accent,
                      }}
                    >
                      {recommendation}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            <div>
              <h3
                className="font-semibold mb-3"
                style={{ color: themeConfig.colors.accent }}
              >
                📈 Metrics ({selectedCategory})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className="border-b"
                      style={{ borderColor: themeConfig.colors.border }}
                    >
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Duration</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getMetricsByCategory()
                      .slice(-50)
                      .reverse()
                      .map((metric, index) => (
                        <tr
                          key={index}
                          className="border-b hover:bg-opacity-50 transition-colors"
                          style={{
                            borderColor: themeConfig.colors.border,
                            backgroundColor:
                              index % 2 === 0
                                ? "transparent"
                                : `${themeConfig.colors.accent}05`,
                          }}
                        >
                          <td className="p-2 font-mono">{metric.name}</td>
                          <td
                            className="p-2 font-mono"
                            style={{
                              color: getPerformanceColor(
                                metric.value,
                                metric.category === "command"
                                  ? { good: 50, warning: 200 }
                                  : { good: 16, warning: 50 },
                              ),
                            }}
                          >
                            {formatTime(metric.value)}
                          </td>
                          <td className="p-2">
                            <span
                              className="px-2 py-1 rounded text-xs"
                              style={{
                                backgroundColor: `${themeConfig.colors.accent}20`,
                                color: themeConfig.colors.accent,
                              }}
                            >
                              {metric.category}
                            </span>
                          </td>
                          <td className="p-2 text-xs opacity-75">
                            {new Date(
                              report.generatedAt -
                                (performance.now() - metric.timestamp),
                            ).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
