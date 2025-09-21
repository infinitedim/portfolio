"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../../hooks/useTheme";

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

/**
 * PWA Install Prompt component that shows a terminal-style install notification
 */
export function PWAInstallPrompt({
  onInstall,
  onDismiss,
}: PWAInstallPromptProps) {
  const { themeConfig } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000); // Show after 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = () => {
    setIsVisible(false);
    onInstall?.();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom duration-300">
      <div
        className="border rounded-lg p-4 shadow-lg backdrop-blur-sm"
        style={{
          backgroundColor: `${themeConfig?.colors?.bg || "#000000"}e6`,
          borderColor: themeConfig?.colors?.accent || "#00ff41",
          color: themeConfig?.colors?.text || "#ffffff",
        }}
      >
        {/* Terminal-style header */}
        <div
          className="flex items-center gap-2 pb-2 mb-3 border-b"
          style={{
            borderColor: `${themeConfig?.colors?.accent || "#00ff41"}33`,
          }}
        >
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm font-mono">install.sh</span>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📱</span>
            <div>
              <div className="font-semibold text-sm">Install Portfolio App</div>
              <div
                className="text-xs opacity-75"
                style={{ color: themeConfig?.colors?.text || "#ffffff" }}
              >
                Get the native app experience
              </div>
            </div>
          </div>

          <div
            className="text-xs font-mono p-2 rounded"
            style={{
              backgroundColor: `${themeConfig?.colors?.accent || "#00ff41"}11`,
            }}
          >
            ✨ Benefits: Faster loading • Offline access • Native feel
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleInstall}
              className="flex-1 px-3 py-2 text-sm font-medium rounded transition-colors duration-200"
              style={{
                backgroundColor: themeConfig?.colors?.accent || "#00ff41",
                color: themeConfig?.colors?.bg || "#000000",
              }}
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-sm font-medium rounded border transition-colors duration-200 hover:opacity-80"
              style={{
                borderColor: `${themeConfig?.colors?.accent || "#00ff41"}66`,
                color: themeConfig?.colors?.text || "#ffffff",
              }}
            >
              Later
            </button>
          </div>

          {/* Terminal command hint */}
          <div
            className="text-xs font-mono opacity-60 pt-1 border-t"
            style={{
              borderColor: `${themeConfig?.colors?.accent || "#00ff41"}22`,
            }}
          >
            💡 Or type: <span className="font-bold">pwa -i</span>
          </div>
        </div>
      </div>
    </div>
  );
}
