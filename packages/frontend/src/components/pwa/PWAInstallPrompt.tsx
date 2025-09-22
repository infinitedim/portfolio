"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "../../hooks/useTheme";

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  delay?: number;
  persistDismissal?: boolean;
}

/**
 * PWA Install Prompt component that shows a terminal-style install notification
 * with enhanced error handling and smooth animations
 *
 * @param onInstall - Callback when install button is clicked
 * @param onDismiss - Callback when dismiss button is clicked
 * @param delay - Delay before showing prompt in ms (default: 3000)
 * @param persistDismissal - Remember dismissal in localStorage (default: true)
 */
export function PWAInstallPrompt({
  onInstall,
  onDismiss,
  delay = 3000,
  persistDismissal = true,
}: PWAInstallPromptProps) {
  const { themeConfig } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const dismissedRef = useRef<boolean>(false);

  // Check if prompt was previously dismissed
  const checkDismissalStatus = useCallback((): boolean => {
    if (!persistDismissal) return false;

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const dismissed = window.localStorage.getItem("pwa-prompt-dismissed");
        return dismissed === "true";
      }
    } catch (error) {
      console.warn("PWA Prompt: Failed to check dismissal status:", error);
    }
    return false;
  }, [persistDismissal]);

  // Save dismissal status
  const saveDismissalStatus = useCallback((): void => {
    if (!persistDismissal) return;

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("pwa-prompt-dismissed", "true");
      }
    } catch (error) {
      console.warn("PWA Prompt: Failed to save dismissal status:", error);
    }
  }, [persistDismissal]);

  // Safe timeout helper
  const safeSetTimeout = useCallback(
    (callback: () => void, ms: number): number | null => {
      if (typeof window === "undefined" || !window.setTimeout) return null;

      try {
        return window.setTimeout(callback, ms);
      } catch (error) {
        console.error("PWA Prompt: Failed to set timeout:", error);
        return null;
      }
    },
    [],
  );

  // Safe clear timeout helper
  const safeClearTimeout = useCallback((id: number | null): void => {
    if (typeof window === "undefined" || !window.clearTimeout || !id) return;

    try {
      window.clearTimeout(id);
    } catch (error) {
      console.error("PWA Prompt: Failed to clear timeout:", error);
    }
  }, []);

  // Handle install button click with proper error handling
  const handleInstall = useCallback(() => {
    try {
      console.log("PWA Prompt: Install button clicked");
      setIsAnimating(true);

      // Delay to allow animation
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);

        // Call the install callback if provided
        if (typeof onInstall === "function") {
          try {
            onInstall();
          } catch (error) {
            console.error("PWA Prompt: Install callback error:", error);
          }
        }
      }, 300);
    } catch (error) {
      console.error("PWA Prompt: Error handling install:", error);
      setIsVisible(false);
      setIsAnimating(false);
    }
  }, [onInstall]);

  // Handle dismiss button click with proper error handling
  const handleDismiss = useCallback(() => {
    try {
      console.log("PWA Prompt: Dismiss button clicked");
      setIsAnimating(true);
      dismissedRef.current = true;

      // Save dismissal status
      saveDismissalStatus();

      // Delay to allow animation
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);

        // Call the dismiss callback if provided
        if (typeof onDismiss === "function") {
          try {
            onDismiss();
          } catch (error) {
            console.error("PWA Prompt: Dismiss callback error:", error);
          }
        }
      }, 300);
    } catch (error) {
      console.error("PWA Prompt: Error handling dismiss:", error);
      setIsVisible(false);
      setIsAnimating(false);
    }
  }, [onDismiss, saveDismissalStatus]);

  // Handle keyboard events for accessibility
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      try {
        if (event.key === "Escape" && isVisible) {
          handleDismiss();
        }
      } catch (error) {
        console.error("PWA Prompt: Keyboard event error:", error);
      }
    },
    [isVisible, handleDismiss],
  );

  useEffect(() => {
    // Check if already dismissed
    if (checkDismissalStatus()) {
      dismissedRef.current = true;
      return;
    }

    // Check if we're in a browser environment
    if (typeof window === "undefined") return;

    // Don't show if already dismissed in this session
    if (dismissedRef.current) return;

    // Set up the delayed appearance
    timeoutRef.current = safeSetTimeout(() => {
      if (!dismissedRef.current) {
        setIsVisible(true);
        console.log("PWA Prompt: Showing install prompt");
      }
    }, delay);

    // Add keyboard event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        safeClearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    delay,
    checkDismissalStatus,
    handleKeyDown,
    safeSetTimeout,
    safeClearTimeout,
  ]);

  // Don't render if not visible
  if (!isVisible) return null;

  const bgColor = themeConfig?.colors?.bg || "#000000";
  const accentColor = themeConfig?.colors?.accent || "#00ff41";
  const textColor = themeConfig?.colors?.text || "#ffffff";

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50
        ${isAnimating ? "animate-out slide-out-to-bottom" : "animate-in slide-in-from-bottom"}
        duration-300`}
      role="dialog"
      aria-labelledby="pwa-prompt-title"
      aria-describedby="pwa-prompt-description"
    >
      <div
        className="border rounded-lg p-4 shadow-2xl backdrop-blur-md transition-all hover:shadow-3xl"
        style={{
          backgroundColor: `${bgColor}e6`,
          color: textColor,
          boxShadow: `0 0 20px ${accentColor}33`,
        }}
      >
        <div className="flex items-center gap-2 pb-2 mb-3 border-b">
          <div className="flex gap-1.5">
            <button
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              onClick={handleDismiss}
              aria-label="Close"
            />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm font-mono flex items-center gap-1">
            <span style={{ color: accentColor }}>$</span>
            install.sh
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl animate-pulse">📱</div>
            <div className="flex-1">
              <h2
                id="pwa-prompt-title"
                className="font-semibold text-sm"
              >
                Install Portfolio App
              </h2>
              <p
                id="pwa-prompt-description"
                className="text-xs opacity-75 mt-0.5"
                style={{ color: textColor }}
              >
                Get the native app experience
              </p>
            </div>
          </div>

          <div
            className="text-xs font-mono p-2.5 rounded space-y-1"
            style={{
              backgroundColor: `${accentColor}11`,
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: accentColor }}>✓</span>
              <span>Faster loading & offline access</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: accentColor }}>✓</span>
              <span>Native app experience</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: accentColor }}>✓</span>
              <span>Home screen shortcut</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleInstall}
              className="flex-1 px-3 py-2 text-sm font-medium rounded transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: accentColor,
                color: bgColor,
                boxShadow: `0 0 10px ${accentColor}66`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 15px ${accentColor}99`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 0 10px ${accentColor}66`;
              }}
            >
              Install Now
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-sm font-medium rounded border transition-all duration-200 hover:opacity-80 active:scale-95"
              style={{
                color: textColor,
                backgroundColor: `${accentColor}11`,
              }}
            >
              Later
            </button>
          </div>

          <div
            className="text-xs font-mono opacity-60 pt-1 border-t flex items-center justify-between"
            style={{}}
          >
            <span>
              💡 Tip: <span className="font-bold">pwa --install</span>
            </span>
            <span className="text-xs opacity-50">ESC to dismiss</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PWAInstallPrompt;
