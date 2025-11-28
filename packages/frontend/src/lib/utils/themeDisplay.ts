import {
  themes,
  getSortedThemeNames,
} from "@portfolio/frontend/src/lib/themes/themeConfig";
import type {
  ThemeName,
  ThemeRegistry,
} from "@portfolio/frontend/src/types/theme";

export interface ThemeDisplayOptions {
  showCurrent?: boolean;
  currentTheme?: ThemeName;
  compact?: boolean;
  showColors?: boolean;
  columns?: number;
}

export class ThemeDisplay {
  static generateList(options: ThemeDisplayOptions = {}): string {
    const {
      showCurrent = true,
      currentTheme,
      compact = false,
      showColors = true,
      columns = 2,
    } = options;

    const sortedThemes = getSortedThemeNames();
    const lines: string[] = [];

    if (!compact) {
      lines.push("🎨 Available Terminal Themes");
      lines.push("═".repeat(50));
      lines.push("");
    }

    if (showCurrent && currentTheme) {
      const currentConfig = themes[currentTheme];
      lines.push(`📍 Current Theme: ${currentConfig.name} (${currentTheme})`);
      if (showColors) {
        lines.push(
          `   Colors: bg:${currentConfig.colors.bg} text:${currentConfig.colors.text} accent:${currentConfig.colors.accent}`,
        );
      }
      lines.push("");
    }

    if (compact) {
      // Compact single-line format
      const themeList = sortedThemes
        .map((theme) => (currentTheme === theme ? `[${theme}]` : theme))
        .join(", ");
      lines.push(`Themes: ${themeList}`);
    } else {
      // Detailed multi-column format
      lines.push("📋 Theme List:");
      lines.push("");

      // Group themes into columns
      const themeGroups: string[][] = [];
      for (let i = 0; i < sortedThemes.length; i += columns) {
        themeGroups.push(sortedThemes.slice(i, i + columns));
      }

      themeGroups.forEach((group) => {
        const row = group
          .map((theme) => {
            const config = (themes as ThemeRegistry)[theme as ThemeName];
            if (!config) return null;
            const isCurrent = currentTheme === theme;
            const indicator = isCurrent ? "► " : "  ";
            const name = theme.padEnd(12);
            const displayName = config.name.padEnd(20);

            if (showColors) {
              return `${indicator}${name} - ${displayName} ${isCurrent ? "🟢" : "⚪"}`;
            } else {
              return `${indicator}${name} - ${displayName} ${isCurrent ? "(current)" : ""}`;
            }
          })
          .filter(Boolean)
          .join("  ");

        lines.push(row);
      });

      lines.push("");
      lines.push(`Total: ${sortedThemes.length} themes available`);
    }

    return lines.join("\n");
  }

  static generateColorPreview(themeName: ThemeName): string {
    const config = themes[themeName];
    if (!config) return "";

    const lines = [
      `🎨 ${config.name} Color Preview`,
      "─".repeat(30),
      "",
      `Background:  ${config.colors.bg}`,
      `Text:        ${config.colors.text}`,
      `Prompt:      ${config.colors.prompt}`,
      `Success:     ${config.colors.success}`,
      `Error:       ${config.colors.error}`,
      `Accent:      ${config.colors.accent}`,
      `Border:      ${config.colors.border}`,
      "",
      "Usage: theme " + themeName,
    ];

    return lines.join("\n");
  }

  static generateThemeComparison(themeNames: ThemeName[]): string {
    if (themeNames.length === 0) return "No themes to compare";

    const lines = ["🔍 Theme Comparison", "═".repeat(50), ""];

    const maxNameLength = Math.max(...themeNames.map((t) => t.length));

    themeNames.forEach((themeName) => {
      const config = (themes as ThemeRegistry)[themeName];
      if (!config) return;

      lines.push(`${themeName.padEnd(maxNameLength)} | ${config.name}`);
    });

    return lines.join("\n");
  }
}
