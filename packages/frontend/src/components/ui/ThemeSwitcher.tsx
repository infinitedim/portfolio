/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@portfolio/ui/src/button";
import { useTheme } from "@/hooks/useTheme";
import type { JSX } from "react";

/**
 * ThemeSwitcher component that allows users to switch between different terminal themes.
 * It uses the terminal theme system for theme management.
 * @returns {JSX.Element} The ThemeSwitcher component
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
