"use client";

import type React from "react";
import { useState, useEffect, JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import { useMobile } from "@portfolio/frontend/src/hooks/useMobile";

interface MobileTerminalProps {
  children: React.ReactNode;
}

/**
 * A wrapper component that provides a mobile-optimized terminal experience.
 * It handles mobile-specific UI adjustments, such as showing hints,
 * a dedicated header, and a quick command bar.
 * @param {MobileTerminalProps} props - The properties for the MobileTerminal component.
 * @param {React.ReactNode} props.children - The content to be rendered within the mobile terminal layout.
 * @returns {JSX.Element} - A mobile-optimized terminal layout or the original children if not on a mobile device.
 */
export function MobileTerminal({ children }: MobileTerminalProps): JSX.Element {
  const { themeConfig, theme } = useTheme();
  const { isMobile, isVirtualKeyboardOpen, orientation } = useMobile();
  const [showMobileHint, setShowMobileHint] = useState(false);

  useEffect(() => {
    if (isMobile && !localStorage.getItem("mobile-hint-dismissed")) {
      setShowMobileHint(true);
    }
  }, [isMobile]);

  const dismissMobileHint = () => {
    setShowMobileHint(false);
    localStorage.setItem("mobile-hint-dismissed", "true");
  };

  const handleCommandClick = (command: string) => {
    const input = document.querySelector("input") as HTMLInputElement;
    if (input) {
      input.value = command;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    }
  };

  const handleFocusInput = () => {
    const input = document.querySelector("input");
    input?.focus();
  };

  if (!isMobile) {
    return <>{children}</>;
  }

  // Don't render if themeConfig is not available
  if (!themeConfig?.colors) {
    return <div key={`mobile-terminal-no-config-${theme}`}>{children}</div>;
  }

  return (
    <div
      key={`mobile-terminal-${theme}`}
      className={`mobile-terminal ${isVirtualKeyboardOpen ? "keyboard-visible" : ""} ${orientation === "landscape" ? "landscape-mode" : "portrait-mode"}`}
      style={{
        minHeight: isVirtualKeyboardOpen ? "auto" : "100vh",
        paddingBottom: isVirtualKeyboardOpen
          ? "0"
          : "env(safe-area-inset-bottom)",
        // Improve touch interactions
        touchAction: "manipulation",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {/* Mobile Hint */}
      {showMobileHint && (
        <div
          className="fixed top-0 left-0 right-0 z-50 p-4 text-sm animate-in slide-in-from-top duration-300"
          style={{
            backgroundColor: themeConfig.colors.accent,
            color: themeConfig.colors.bg,
            paddingTop: "calc(1rem + env(safe-area-inset-top))",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">📱</span>
              <div>
                <div className="font-medium">Mobile Terminal Ready!</div>
                <div className="text-xs opacity-90 mt-1">
                  {isMobile ? "Phone" : "Tablet"} • {orientation} • Optimized
                  for touch
                </div>
              </div>
            </div>
            <button
              onClick={dismissMobileHint}
              className="text-xl hover:opacity-70 focus:opacity-70 p-2 -m-2 transition-opacity"
              aria-label="Dismiss mobile hint"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Mobile-specific header - Compact version */}
      <div
        className="sticky top-0 z-40 px-3 py-2 border-b backdrop-blur-sm"
        style={{
          backgroundColor: `${themeConfig.colors.bg}f5`,
          borderColor: themeConfig.colors.border,
          paddingTop: "calc(0.5rem + env(safe-area-inset-top))",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="text-xs font-mono font-bold"
              style={{ color: themeConfig.colors.accent }}
            >
              Terminal Portfolio
            </div>
            {!isMobile && (
              <div
                className="text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: `${themeConfig.colors.accent}20`,
                  color: themeConfig.colors.accent,
                }}
              >
                Tablet
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 hover:scale-105 active:scale-95"
              style={{
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
                backgroundColor: `${themeConfig.colors.accent}15`,
              }}
              onClick={handleFocusInput}
              aria-label="Focus command input"
            >
              Focus Input
            </button>
            {orientation === "landscape" && (
              <div
                className="text-xs px-2 py-1 rounded opacity-75"
                style={{
                  color: themeConfig.colors.muted,
                  backgroundColor: `${themeConfig.colors.muted}20`,
                }}
              >
                Landscape
              </div>
            )}
          </div>
        </div>
      </div>

      {children}

      {/* Mobile command suggestions */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 border-t backdrop-blur-sm"
        style={{
          backgroundColor: `${themeConfig.colors.bg}f5`,
          borderColor: themeConfig.colors.border,
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
        }}
        role="toolbar"
        aria-label="Quick commands"
      >
        <div className="mb-3">
          <div
            className="text-xs font-medium mb-2"
            style={{ color: themeConfig.colors.muted }}
          >
            Quick Commands:
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {["help", "about", "skills", "theme -l", "roadmap", "clear"].map(
              (cmd) => (
                <button
                  key={cmd}
                  className="px-4 py-3 text-sm rounded-lg border whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 hover:scale-105 active:scale-95 min-h-[48px] font-mono"
                  style={{
                    borderColor: themeConfig.colors.border,
                    color: themeConfig.colors.text,
                    backgroundColor: `${themeConfig.colors.accent}15`,
                  }}
                  onClick={() => handleCommandClick(cmd)}
                  aria-label={`Execute command: ${cmd}`}
                >
                  {cmd}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Enhanced swipe indicator with interaction hint */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="w-12 h-1 rounded-full"
            style={{ backgroundColor: themeConfig.colors.border }}
            aria-hidden="true"
          />
          <div
            className="text-xs opacity-60"
            style={{ color: themeConfig.colors.muted }}
          >
            Swipe for more commands
          </div>
        </div>
      </div>
    </div>
  );
}
