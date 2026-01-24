"use client";

import type React from "react";
import { JSX, useEffect, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";

/**
 * Props for the AnimatedButton component
 * @interface AnimatedButtonProps
 * @property {React.ReactNode} children - Button content
 * @property {() => void} [onClick] - Click handler function
 * @property {"primary" | "secondary" | "success" | "error" | "warning"} [variant] - Style variant
 * @property {"sm" | "md" | "lg"} [size] - Button size
 * @property {boolean} [disabled] - Whether button is disabled
 * @property {boolean} [loading] - Whether button is in loading state
 * @property {string} [className] - Additional CSS classes
 * @property {string} [ariaLabel] - Accessibility label
 */
interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "success" | "error" | "warning";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Animated button component with variant styles and theme-aware colors
 * Provides visual feedback with hover effects, loading states, and accessibility support
 * @param {AnimatedButtonProps} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {() => void} [props.onClick] - Click handler
 * @param {"primary" | "secondary" | "success" | "error" | "warning"} [props.variant="primary"] - Style variant
 * @param {"sm" | "md" | "lg"} [props.size="md"] - Button size
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {boolean} [props.loading=false] - Loading state
 * @param {string} [props.className] - Additional classes
 * @param {string} [props.ariaLabel] - Accessibility label
 * @returns {JSX.Element} The rendered animated button
 * @example
 * ```tsx
 * <AnimatedButton
 *   variant="primary"
 *   size="md"
 *   onClick={handleClick}
 * >
 *   Click me
 * </AnimatedButton>
 * ```
 */
export function AnimatedButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  ariaLabel,
}: AnimatedButtonProps): JSX.Element {
  const { themeConfig, theme } = useTheme();
  const { isReducedMotion } = useAccessibility();
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    setRenderKey((prev) => prev + 1);
  }, [theme]);

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: `${themeConfig.colors.accent}20`,
          borderColor: themeConfig.colors.accent,
          color: themeConfig.colors.accent,
          hoverBg: `${themeConfig.colors.accent}30`,
        };
      case "secondary":
        return {
          backgroundColor: `${themeConfig.colors.muted}20`,
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.text,
          hoverBg: `${themeConfig.colors.muted}30`,
        };
      case "success":
        return {
          backgroundColor: `${themeConfig.colors.success || themeConfig.colors.accent}20`,
          borderColor: themeConfig.colors.success || themeConfig.colors.accent,
          color: themeConfig.colors.success || themeConfig.colors.accent,
          hoverBg: `${themeConfig.colors.success || themeConfig.colors.accent}30`,
        };
      case "error":
        return {
          backgroundColor: `${themeConfig.colors.error || "#ff4444"}20`,
          borderColor: themeConfig.colors.error || "#ff4444",
          color: themeConfig.colors.error || "#ff4444",
          hoverBg: `${themeConfig.colors.error || "#ff4444"}30`,
        };
      case "warning":
        return {
          backgroundColor: `${themeConfig.colors.warning || "#ffaa00"}20`,
          borderColor: themeConfig.colors.warning || "#ffaa00",
          color: themeConfig.colors.warning || "#ffaa00",
          hoverBg: `${themeConfig.colors.warning || "#ffaa00"}30`,
        };
      default:
        return {
          backgroundColor: `${themeConfig.colors.accent}20`,
          borderColor: themeConfig.colors.accent,
          color: themeConfig.colors.accent,
          hoverBg: `${themeConfig.colors.accent}30`,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "px-2 py-1 text-xs";
      case "lg":
        return "px-6 py-3 text-lg";
      default:
        return "px-4 py-2 text-sm";
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <button
      key={`animated-button-${theme}-${renderKey}`}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeStyles}
        rounded border font-medium
        focus:outline-none focus:ring-2 focus:ring-opacity-50
        ${!isReducedMotion ? "transition-all duration-300 hover:scale-105" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      style={{
        backgroundColor: variantStyles.backgroundColor,
        borderColor: variantStyles.borderColor,
        color: variantStyles.color,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isReducedMotion) {
          e.currentTarget.style.backgroundColor = variantStyles.hoverBg;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = variantStyles.backgroundColor;
        }
      }}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
