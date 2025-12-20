"use client";

import { useTheme } from "@/hooks/useTheme";
import type { JSX } from "react";

interface ProgressBarProps {
  progress: number;
  height?: string;
  className?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

/**
 * A simple progress bar component for visualizing completion percentage.
 * @param {ProgressBarProps} props - The properties for the ProgressBar component.
 * @param {number} props.progress - The progress value (0-100).
 * @param {string} [props.height] - The height of the progress bar (Tailwind class).
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @param {boolean} [props.showPercentage] - Whether to display the percentage text.
 * @param {boolean} [props.animated] - Whether to animate the progress bar.
 * @returns {JSX.Element} - A progress bar component.
 */
export function ProgressBar({
  progress,
  height = "h-2",
  className = "",
  showPercentage = false,
  animated = true,
}: ProgressBarProps): JSX.Element {
  const { themeConfig, theme } = useTheme();

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      key={`progress-bar-${theme}`}
      className={`relative ${className}`}
    >
      <div
        className={`w-full ${height} rounded-full overflow-hidden`}
        style={{ backgroundColor: `${themeConfig.colors.border}40` }}
      >
        <div
          className={`${height} rounded-full transition-all duration-500 ease-out ${
            animated ? "animate-pulse" : ""
          }`}
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: themeConfig.colors.accent,
            boxShadow: `0 0 8px ${themeConfig.colors.accent}40`,
          }}
        />
      </div>
      {showPercentage && (
        <div
          className="absolute inset-0 flex items-center justify-center text-xs font-mono"
          style={{ color: themeConfig.colors.text }}
        >
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
}
