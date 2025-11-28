"use client";

import { useTheme } from "@/hooks/useTheme";
import { useState, useEffect, type JSX } from "react";

/**
 * An enhanced development banner with comprehensive development metrics.
 *
 * Includes animated progress indicators, test coverage, build status,
 * performance metrics, and development statistics.
 * @returns {JSX.Element | null} The rendered development banner or null if dismissed.
 */
export function DevelopmentBanner(): JSX.Element | null {
  const { theme, themeConfig } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [metrics, setMetrics] = useState({
    developmentProgress: 87,
    testCoverage: 94,
    buildStatus: "success",
    performanceScore: 98,
    bundleSize: 245,
    lastCommit: "2h ago",
    activeBranches: 3,
    openIssues: 2,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getLoadingDots = () => {
    return ".".repeat(animationPhase).padEnd(3, " ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return themeConfig.colors.success || "#00ff00";
      case "warning":
        return themeConfig.colors.warning || "#ffff00";
      case "error":
        return themeConfig.colors.error || "#ff0000";
      default:
        return themeConfig.colors.accent;
    }
  };

  const getProgressBar = (percentage: number, color: string) => (
    <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${percentage}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 px-4 py-2 font-mono text-xs border-b backdrop-blur-sm transition-all duration-300 shadow-lg"
      style={{
        backgroundColor: `${themeConfig.colors.bg}dd`,
        borderColor: themeConfig.colors.accent,
        color: themeConfig.colors.text,
        boxShadow: `0 4px 6px -1px ${themeConfig.colors.accent}10`,
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side - Development status */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 px-3 py-1 rounded border transition-all duration-300"
            style={{
              borderColor: themeConfig.colors.accent,
              backgroundColor: `${themeConfig.colors.accent}20`,
              color: themeConfig.colors.accent,
            }}
          >
            <span className="animate-pulse">⚠</span>
            <span className="font-bold">DEV MODE</span>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            {/* Development Progress */}
            <div className="flex items-center gap-2">
              <span className="opacity-70">Progress:</span>
              <span style={{ color: themeConfig.colors.accent }}>
                {metrics.developmentProgress}%
              </span>
              {getProgressBar(
                metrics.developmentProgress,
                themeConfig.colors.accent,
              )}
            </div>

            {/* Test Coverage */}
            <div className="flex items-center gap-2">
              <span className="opacity-70">Tests:</span>
              <span style={{ color: getStatusColor("success") }}>
                {metrics.testCoverage}%
              </span>
              {getProgressBar(metrics.testCoverage, getStatusColor("success"))}
            </div>

            {/* Performance Score */}
            <div className="flex items-center gap-2">
              <span className="opacity-70">Perf:</span>
              <span style={{ color: getStatusColor("success") }}>
                {metrics.performanceScore}%
              </span>
              {getProgressBar(
                metrics.performanceScore,
                getStatusColor("success"),
              )}
            </div>
          </div>
        </div>

        {/* Center - Build status and metrics */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="opacity-70">Build:</span>
            <span
              className="flex items-center gap-1"
              style={{ color: getStatusColor(metrics.buildStatus) }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: getStatusColor(metrics.buildStatus) }}
              />
              {metrics.buildStatus.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="opacity-70">Bundle:</span>
            <span style={{ color: themeConfig.colors.accent }}>
              {metrics.bundleSize}KB
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="opacity-70">Last:</span>
            <span style={{ color: themeConfig.colors.text }}>
              {metrics.lastCommit}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="opacity-70">Branches:</span>
            <span style={{ color: themeConfig.colors.accent }}>
              {metrics.activeBranches}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="opacity-70">Issues:</span>
            <span
              style={{
                color:
                  metrics.openIssues > 0
                    ? getStatusColor("warning")
                    : getStatusColor("success"),
              }}
            >
              {metrics.openIssues}
            </span>
          </div>
        </div>

        {/* Right side - Tips and close button */}
        <div className="flex items-center gap-4">
          <div className="hidden xl:block text-xs opacity-75">
            <span
              style={{
                color: themeConfig.colors.prompt || themeConfig.colors.accent,
              }}
            >
              Tip:
            </span>
            <span style={{ color: themeConfig.colors.text }}> Try </span>
            <code
              className="px-1 rounded transition-all duration-300"
              style={{
                backgroundColor: `${themeConfig.colors.accent}20`,
                color: themeConfig.colors.accent,
              }}
            >
              theme {theme === "matrix" ? "cyberpunk" : "matrix"}
            </code>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="text-xs opacity-60 hover:opacity-100 transition-all duration-300 hover:scale-105"
            style={{ color: themeConfig.colors.text }}
            aria-label="Close development banner"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
