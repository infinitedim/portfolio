import { themes, getSortedThemeNames } from "@/lib/themes/theme-config";
import type { ThemeName, ThemeRegistry } from "@/types/theme";

/**
 * Configuration options for theme display formatting
 * @property showCurrent - Whether to highlight the currently active theme
 * @property currentTheme - Name of the currently active theme
 * @property compact - Whether to use a compact display format
 * @property showColors - Whether to display color codes
 * @property columns - Number of columns for theme list layout
 */
export interface ThemeDisplayOptions {
  showCurrent?: boolean;
  currentTheme?: ThemeName;
  compact?: boolean;
  showColors?: boolean;
  columns?: number;
}

/**
 * Utility class for generating formatted theme listings and previews
 * Provides methods to display available themes, color previews, and comparisons
 */
export class ThemeDisplay {
  /**
   * Generates a formatted list of all available themes
   * @param options - Display configuration options
   * @returns Formatted string containing the theme list
   * @example
   * ```ts
   * const list = ThemeDisplay.generateList({
   *   showCurrent: true,
   *   currentTheme: 'dracula',
   *   columns: 2
   * });
   * console.log(list);
   * ```
   */
  static generateList(options: ThemeDisplayOptions = {}): string {
    const {
      showCurrent = true,
      currentTheme,
      compact = false,
      showColors = true,
      columns: rawColumns = 2,
    } = options;

    const columns = Math.max(1, rawColumns);

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
      const themeList = sortedThemes
        .map((theme) => (currentTheme === theme ? `[${theme}]` : theme))
        .join(", ");
      lines.push(`Themes: ${themeList}`);
    } else {
      lines.push("📋 Theme List:");
      lines.push("");

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

  /**
   * Generates a color preview for a specific theme
   * Shows all color values used in the theme including background, text, and accents
   * @param themeName - Name of the theme to preview
   * @returns Formatted string containing the theme's color palette
   * @example
   * ```ts
   * const preview = ThemeDisplay.generateColorPreview('dracula');
   * console.log(preview);
   * // Shows: Background, Text, Prompt, Success, Error, Accent, Border colors
   * ```
   */
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

  /**
   * Generates a comparison table for multiple themes
   * Shows theme names and display names side by side for easy comparison
   * @param themeNames - Array of theme names to compare
   * @returns Formatted string containing the theme comparison
   * @example
   * ```ts
   * const comparison = ThemeDisplay.generateThemeComparison(['dracula', 'monokai', 'nord']);
   * console.log(comparison);
   * ```
   */
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
