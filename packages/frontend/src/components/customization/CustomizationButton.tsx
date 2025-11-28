"use client";

import { type JSX, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { CustomizationManager } from "./CustomizationManager";

/**
 * A floating button that opens the customization manager.
 * @returns {JSX.Element} - The customization button component.
 */
export function CustomizationButton(): JSX.Element {
  const { themeConfig, theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        key={`customization-button-${theme}`}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 rounded-full border backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-opacity-50 z-40"
        style={{
          backgroundColor: `${themeConfig.colors.bg}dd`,
          borderColor: themeConfig.colors.accent,
          color: themeConfig.colors.accent,
          boxShadow: `0 4px 16px ${themeConfig.colors.accent}40`,
        }}
        aria-label="Open customization manager"
        title="Customize themes and fonts"
      >
        <span className="text-lg">🎨</span>
      </button>

      <CustomizationManager
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
