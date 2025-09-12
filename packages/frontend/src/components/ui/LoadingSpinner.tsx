/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import type { JSX } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  [key: string]: any;
}

/**
 * A loading spinner component to indicate background activity.
 *
 * This component displays a spinning indicator and optional text label,
 * with size variations and theme-based styling. It supports accessibility
 * via ARIA roles and works well for async or loading states.
 * @param {object} props - Props object
 * @param {"sm" | "md" | "lg"} [props.size] - Size of the spinner and text
 * @param {string} [props.text] - Optional text to display next to the spinner.
 * @param {string} [props.className] - Additional classes to apply to the container
 * @example
 * <LoadingSpinner text="Loading..." size="lg" />
 * @returns {JSX.Element} The rendered loading spinner
 */
export function LoadingSpinner({
  size = "md",
  text,
  className = "",
  ...props
}: LoadingSpinnerProps): JSX.Element {
  const { themeConfig, theme } = useTheme();

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      key={`loading-spinner-${theme}`}
      className={`flex items-center gap-2 ${className}`}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <div
        className={`${sizeClasses[size]} border-2 border-transparent border-t-current rounded-full animate-spin`}
        style={{ borderTopColor: themeConfig.colors.accent }}
        aria-hidden="true"
      />
      {text && (
        <span
          className={`${textSizes[size]} font-mono animate-pulse`}
          style={{ color: themeConfig.colors.text }}
        >
          {text}
        </span>
      )}
    </div>
  );
}
