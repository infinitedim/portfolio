"use client";

import { useTheme } from "@/hooks/useTheme";
import type { JSX } from "react";

interface ProgressIndicatorProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

/**
 * A visual progress bar component that shows completion percentage.
 *
 * This component displays a styled progress bar, with optional label and percentage.
 * It adapts to the current theme and can be resized and animated.
 * @param {object} props - Props object
 * @param {number} props.progress - Progress value (from 0 to 100)
 * @param {string} [props.label] - Optional label to display above the bar
 * @param {boolean} [props.showPercentage] - Whether to display percentage value
 * @param {"sm" | "md" | "lg"} [props.size] - Size of the progress bar
 * @param {boolean} [props.animated] - Whether the progress bar should animate.
 * @example
 * <ProgressIndicator progress={75} label="Loading..." />
 * @returns {JSX.Element} The rendered progress bar
 */
export function ProgressIndicator({
  progress,
  label,
  showPercentage = true,
  size = "md",
  animated = true,
}: ProgressIndicatorProps): JSX.Element {
  const { themeConfig, theme } = useTheme();

  const heights = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      key={`progress-indicator-${theme}`}
      className="w-full"
    >
      {(label || showPercentage) && (
        <div
          className={`flex justify-between items-center mb-1 ${textSizes[size]}`}
        >
          {label && (
            <span style={{ color: themeConfig.colors.text }}>{label}</span>
          )}
          {showPercentage && (
            <span style={{ color: themeConfig.colors.accent }}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full ${heights[size]} rounded-full overflow-hidden`}
        style={{ backgroundColor: `${themeConfig.colors.border}40` }}
      >
        <div
          className={`${heights[size]} rounded-full transition-all duration-500 ease-out ${
            animated ? "animate-pulse" : ""
          }`}
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: themeConfig.colors.accent,
            boxShadow: `0 0 10px ${themeConfig.colors.accent}40`,
          }}
        />
      </div>
    </div>
  );
}
