/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/ui/button";
import { useTheme } from "@/hooks/useTheme";
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
  const { theme, themeConfig, changeTheme, availableThemes } = useTheme();

  const handleThemeChange = (newTheme: string) => {
    try {
      changeTheme(newTheme as any);
    } catch (error) {
      console.warn("Error changing theme:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {availableThemes.map((themeName) => (
          <Button
            key={themeName}
            variant={theme === themeName ? "default" : "outline"}
            size="sm"
            onClick={() => handleThemeChange(themeName)}
            style={{
              backgroundColor:
                theme === themeName ? themeConfig.colors.accent : undefined,
              color: theme === themeName ? themeConfig.colors.bg : undefined,
              borderColor: themeConfig.colors.border,
            }}
          >
            {themeName}
          </Button>
        ))}
      </div>
    </div>
  );
}
