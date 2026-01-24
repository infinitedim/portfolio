"use client";

import { useTheme } from "@/hooks/use-theme";
import type { JSX, HTMLAttributes } from "react";

/**
 * Props for the LoadingSpinner component
 * @interface LoadingSpinnerProps
 * @property {"sm" | "md" | "lg"} [size] - Size of the spinner
 * @property {string} [text] - Optional text to display
 * @property {string} [className] - Additional CSS classes
 */
interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

/**
 * Loading spinner component for indicating background activity
 * Displays an animated spinner with optional text and size variations
 * @param {LoadingSpinnerProps} props - Component props
 * @param {"sm" | "md" | "lg"} [props.size="md"] - Spinner size
 * @param {string} [props.text] - Optional loading text
 * @param {string} [props.className] - Additional classes
 * @returns {JSX.Element} The rendered loading spinner
 * @example
 * ```tsx
 * <LoadingSpinner size="lg" text="Loading..." />
 * ```
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
