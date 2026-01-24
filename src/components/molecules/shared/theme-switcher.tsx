"use client";

import { AnimatedButton } from "@/components/atoms/shared/button";
import { useTheme } from "@/hooks/use-theme";
import { isThemeName } from "@/types/theme";
import type { JSX } from "react";

/**
 * Theme switcher component for changing terminal themes
 * Displays available themes as buttons and highlights the current theme
 * @returns {JSX.Element} The theme switcher component
 * @example
 * ```tsx
 * <ThemeSwitcher />
 * ```
 */
export function ThemeSwitcher(): JSX.Element {
  const { theme, changeTheme, availableThemes } = useTheme();

  const handleThemeChange = (newTheme: string) => {
    try {
      if (isThemeName(newTheme)) {
        changeTheme(newTheme);
      }
    } catch (error) {
      console.warn("Error changing theme:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {availableThemes.map((themeName) => (
          <AnimatedButton
            key={themeName}
            variant={theme === themeName ? "primary" : "secondary"}
            size="sm"
            onClick={() => handleThemeChange(themeName)}
            className={theme === themeName ? "opacity-100" : "opacity-70"}
          >
            {themeName}
          </AnimatedButton>
        ))}
      </div>
    </div>
  );
}
