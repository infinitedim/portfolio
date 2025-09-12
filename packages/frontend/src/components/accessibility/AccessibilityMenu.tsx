"use client";

import { type JSX, useState, useCallback } from "react";
import { useAccessibility } from "./AccessibilityProvider";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import type { ThemeName } from "@portfolio/frontend/src/types/theme";

/**
 * Renders a menu with accessibility options for the user.
 * Allows users to adjust font size, toggle focus mode, and get information about high contrast and reduced motion settings.
 * @returns {JSX.Element} - The accessibility menu component.
 */
export function AccessibilityMenu(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const {
    fontSize,
    setFontSize,
    isHighContrast,
    isReducedMotion,
    focusMode,
    setFocusMode,
    announceMessage,
  } = useAccessibility();
  const { themeConfig, changeTheme, theme } = useTheme();

  const handleFontSizeChange = useCallback(
    (size: "small" | "medium" | "large") => {
      setFontSize(size);
      announceMessage(`Font size changed to ${size}`, "polite");
    },
    [setFontSize, announceMessage],
  );

  const handleFocusModeToggle = useCallback(() => {
    const newFocusMode = !focusMode;
    setFocusMode(newFocusMode);
    announceMessage(
      `Focus mode ${newFocusMode ? "enabled" : "disabled"}`,
      "polite",
    );
  }, [focusMode, setFocusMode, announceMessage]);

  const handleMenuToggle = useCallback(() => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    announceMessage(
      newIsOpen ? "Accessibility menu opened" : "Accessibility menu closed",
      "polite",
    );
  }, [isOpen, announceMessage]);

  const handleCloseMenu = useCallback(() => {
    setIsOpen(false);
    announceMessage("Accessibility menu closed", "polite");
  }, [announceMessage]);

  const handleThemeToggle = useCallback(() => {
    // Cycle through some popular themes
    const popularThemes: ThemeName[] = [
      "default",
      "matrix",
      "cyberpunk",
      "dracula",
      "nord",
    ];
    const currentTheme = (theme || "default") as ThemeName;
    const currentIndex = popularThemes.indexOf(currentTheme);
    const nextTheme = popularThemes[(currentIndex + 1) % popularThemes.length];

    const success = changeTheme(nextTheme);
    if (success) {
      announceMessage(`Theme changed to ${nextTheme}`, "polite");

      // Close the menu before reloading
      setIsOpen(false);

      // Force page reload to ensure all components re-render with new theme
      // This ensures consistent behavior with terminal theme command
      setTimeout(() => {
        window.location.reload();
      }, 150); // Brief delay to allow announcement and menu close animation
    }
  }, [theme, changeTheme, announceMessage]);

  return (
    <div className="fixed top-4 left-4 z-50">
      <button
        onClick={handleMenuToggle}
        className="p-3 rounded-lg border backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-300 hover:scale-105"
        style={{
          backgroundColor: `${themeConfig.colors.bg}dd`,
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.text,
        }}
        aria-label="Open accessibility menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span
          className="text-lg"
          role="img"
          aria-label="Accessibility"
        >
          ♿
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 p-4 rounded-lg border backdrop-blur-sm min-w-[280px] shadow-lg transition-all duration-300 animate-in slide-in-from-top"
          style={{
            backgroundColor: `${themeConfig.colors.bg}f0`,
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.text,
          }}
          role="menu"
          aria-label="Accessibility options"
        >
          <h3
            className="font-bold mb-4 text-lg"
            style={{ color: themeConfig.colors.accent }}
            id="accessibility-menu-title"
          >
            Accessibility Options
          </h3>

          {/* Font Size Controls */}
          <div
            className="mb-4"
            role="group"
            aria-label="Font Size"
          >
            <div className="block text-sm font-medium mb-2">Font Size:</div>
            <div className="flex gap-2">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => handleFontSizeChange(size)}
                  className={
                    "px-3 py-1 text-sm rounded border transition-all duration-300 hover:scale-105"
                  }
                  style={{
                    backgroundColor:
                      fontSize === size
                        ? `${themeConfig.colors.accent}20`
                        : `${themeConfig.colors.muted}20`,
                    borderColor:
                      fontSize === size
                        ? themeConfig.colors.accent
                        : themeConfig.colors.border,
                    color:
                      fontSize === size
                        ? themeConfig.colors.accent
                        : themeConfig.colors.text,
                  }}
                  aria-label={`Set font size to ${size}`}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Focus Mode Toggle */}
          <div className="mb-4">
            <button
              onClick={handleFocusModeToggle}
              className="w-full px-3 py-2 text-sm rounded border transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: focusMode
                  ? `${themeConfig.colors.success || themeConfig.colors.accent}20`
                  : `${themeConfig.colors.muted}20`,
                borderColor: focusMode
                  ? themeConfig.colors.success || themeConfig.colors.accent
                  : themeConfig.colors.border,
                color: focusMode
                  ? themeConfig.colors.success || themeConfig.colors.accent
                  : themeConfig.colors.text,
              }}
              aria-label={`${focusMode ? "Disable" : "Enable"} focus mode for better keyboard navigation`}
            >
              {focusMode ? "✅ Focus Mode On" : "⭕ Focus Mode Off"}
            </button>
            <p
              className="text-xs mt-1"
              style={{ color: themeConfig.colors.muted }}
            >
              Enhanced keyboard navigation and focus indicators
            </p>
          </div>

          {/* System Preferences Info */}
          <div
            className="text-xs space-y-2 mb-4"
            style={{ color: themeConfig.colors.muted }}
            role="status"
          >
            <div className="flex items-center gap-2">
              <span
                role="img"
                aria-label={isHighContrast ? "Enabled" : "Disabled"}
              >
                {isHighContrast ? "✅" : "❌"}
              </span>
              <span>High Contrast: {isHighContrast ? "On" : "Off"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                role="img"
                aria-label={isReducedMotion ? "Enabled" : "Disabled"}
              >
                {isReducedMotion ? "✅" : "❌"}
              </span>
              <span>Reduced Motion: {isReducedMotion ? "On" : "Off"}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className="pt-3 border-t space-y-2"
            style={{ borderColor: themeConfig.colors.border }}
          >
            <button
              onClick={handleThemeToggle}
              className="w-full text-left px-3 py-2 text-sm rounded border transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: `${themeConfig.colors.muted}20`,
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
              aria-label="Toggle theme"
            >
              🎨 Toggle Theme (Current: {theme})
            </button>

            <button
              onClick={handleCloseMenu}
              className="w-full text-left px-3 py-2 text-sm rounded border transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: `${themeConfig.colors.error || "#ff4444"}20`,
                borderColor: themeConfig.colors.error || "#ff4444",
                color: themeConfig.colors.error || "#ff4444",
              }}
              aria-label="Close accessibility menu"
            >
              ✕ Close Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
