"use client";

import { type JSX, useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";

interface NotificationToastProps {
  message: string;
  type: "info" | "success" | "warning" | "error";
  duration?: number;
  onClose: () => void;
  visible?: boolean;
}

/**
 * A toast notification component for temporary feedback messages.
 *
 * Displays a floating message at the top-right of the screen with different styles
 * depending on the `type` (info, success, warning, error). It auto-dismisses after
 * a specified duration and supports accessibility via ARIA roles and motion reduction.
 *
 * Integrates with theme config and accessibility provider.
 * @param {object} props - Props object
 * @param {string} props.message - The message to display in the toast
 * @param {"info" | "success" | "warning" | "error"} props.type - Type of notification to style accordingly
 * @param {number} [props.duration] - How long the toast stays visible (in ms)
 * @param {() => void} props.onClose - Callback function triggered when toast is closed
 * @param {boolean} [props.visible] - Controls whether the toast is shown
 * @example
 * <NotificationToast
 *   message="Data saved successfully"
 *   type="success"
 *   onClose={() => setShowToast(false)}
 * />
 * @returns {JSX.Element | null} The rendered toast or null if not visible
 */
export function NotificationToast({
  message,
  type,
  visible = true,
  onClose,
  duration = 4000,
}: NotificationToastProps): JSX.Element | null {
  const { themeConfig, theme } = useTheme();
  const [isVisible, setIsVisible] = useState(visible);

  // Update visibility when prop changes
  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  // Auto-dismiss timer
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getTypeStyles = () => {
    const colors = themeConfig?.colors;

    if (!colors) {
      // Fallback colors if theme is not loaded
      return {
        backgroundColor: "#4f46e5",
        color: "#ffffff",
        icon: "ℹ️",
        borderColor: "#4f46e5",
      };
    }

    switch (type) {
      case "success":
        return {
          backgroundColor: colors.success || colors.accent,
          color: colors.bg,
          icon: "✅",
          borderColor: colors.success || colors.accent,
        };
      case "error":
        return {
          backgroundColor: colors.error || "#ff4444",
          color: colors.bg,
          icon: "❌",
          borderColor: colors.error || "#ff4444",
        };
      case "warning":
        return {
          backgroundColor: colors.warning || "#f5a623",
          color: colors.bg,
          icon: "⚠️",
          borderColor: colors.warning || "#f5a623",
        };
      case "info":
      default:
        return {
          backgroundColor: colors.info || colors.accent,
          color: colors.bg,
          icon: "ℹ️",
          borderColor: colors.info || colors.accent,
        };
    }
  };

  const typeStyles = getTypeStyles();

  // Handle close button click
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  if (!isVisible) return null;

  return (
    <div
      key={`notification-toast-${theme}`}
      className={`
        fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg backdrop-blur-sm
        transition-all duration-300 ease-out max-w-sm
        ${
          isVisible
            ? "opacity-100 translate-x-0 animate-in slide-in-from-right"
            : "opacity-0 translate-x-full animate-out slide-out-to-right"
        }
      `}
      style={{
        backgroundColor: `${typeStyles.backgroundColor}dd`, // Semi-transparent
        color: typeStyles.color,
        border: `1px solid ${typeStyles.borderColor}`,
        boxShadow: `0 8px 32px ${typeStyles.backgroundColor}40`,
      }}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center gap-3">
        <span
          className="text-lg shrink-0"
          aria-hidden="true"
          role="img"
        >
          {typeStyles.icon}
        </span>
        <div className="flex-1">
          <p
            className="text-sm font-medium leading-5"
            style={{ color: typeStyles.color }}
          >
            {message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className={`
            opacity-70 hover:opacity-100 transition-all duration-200
            p-1 rounded focus:outline-none focus:ring-2 focus:ring-opacity-50
            hover:scale-110 focus:scale-110
          `}
          style={{
            color: typeStyles.color,
          }}
          aria-label="Close notification"
          type="button"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
  );
}
