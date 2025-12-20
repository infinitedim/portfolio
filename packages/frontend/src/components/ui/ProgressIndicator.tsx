"use client";

import { useTheme } from "@/hooks/useTheme";
import type { JSX } from "react";

/**
 * Props for the ProgressIndicator component
 * @interface ProgressIndicatorProps
 * @property {number} progress - Progress value from 0 to 100
 * @property {string} [label] - Optional label text
 * @property {boolean} [showPercentage] - Whether to show percentage
 * @property {"sm" | "md" | "lg"} [size] - Size of the progress bar
 * @property {boolean} [animated] - Whether to animate the bar
 */
interface ProgressIndicatorProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

/**
 * Progress bar component showing completion percentage
 * Displays a themed progress bar with optional label and percentage display
 * @param {ProgressIndicatorProps} props - Component props
 * @param {number} props.progress - Progress value (0-100)
 * @param {string} [props.label] - Optional label
 * @param {boolean} [props.showPercentage=true] - Show percentage
 * @param {"sm" | "md" | "lg"} [props.size="md"] - Bar size
 * @param {boolean} [props.animated=true] - Enable animation
 * @returns {JSX.Element} The progress indicator component
 * @example
 * ```tsx
 * <ProgressIndicator
 *   progress={75}
 *   label="Loading..."
 *   size="lg"
 * />
 * ```
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
          className={`${heights[size]} rounded-full transition-all duration-500 ease-out ${animated ? "animate-pulse" : ""
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
