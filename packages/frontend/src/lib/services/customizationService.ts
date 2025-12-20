/* eslint-disable @typescript-eslint/no-unused-vars */

import type {
  CustomFont,
  CustomTheme,
  ThemeExport,
  CustomizationSettings,
} from "@/types/customization";
import {themes} from "@/lib/themes/themeConfig";
import {fonts} from "@/lib/fonts/fontConfig";

export class CustomizationService {
  private static instance: CustomizationService;
  private readonly THEMES_KEY = "terminal-custom-themes";
  private readonly FONTS_KEY = "terminal-custom-fonts";
  private readonly SETTINGS_KEY = "terminal-customization-settings";

  static getInstance(): CustomizationService {
    if (!CustomizationService.instance) {
      CustomizationService.instance = new CustomizationService();
    }
    return CustomizationService.instance;
  }

  getCustomThemes(): CustomTheme[] {
    try {
      const stored = localStorage.getItem(this.THEMES_KEY);
      if (!stored) return [];

      const themes = JSON.parse(stored);

      if (typeof themes === "object" && themes !== null) {
        return (themes as CustomTheme[]).map((theme) => ({
          ...theme,
          createdAt: new Date(theme.createdAt),
          modifiedAt: theme.modifiedAt ? new Date(theme.modifiedAt) : undefined,
        })) as CustomTheme[];
      }

      return [];
    } catch (error) {
      console.error("Failed to load custom themes:", error);
      return [];
    }
  }

  getAllThemes(): CustomTheme[] {
    const builtInThemes: CustomTheme[] = Object.entries(themes).map(
      ([id, config]) => ({
        id,
        name: config.name,
        colors: {
          bg: config.colors.bg,
          text: config.colors.text,
          accent: config.colors.accent,
          border: config.colors.border,
          prompt: config.colors.prompt ?? config.colors.accent,
          success: config.colors.success ?? "#10b981",
          error: config.colors.error ?? "#ef4444",
        },
        source: "built-in" as const,
        createdAt: new Date("2024-01-01"),
      }),
    );

    const customThemes = this.getCustomThemes();
    return [...builtInThemes, ...customThemes];
  }

  saveCustomTheme(theme: Omit<CustomTheme, "id" | "createdAt">): CustomTheme {
    const newTheme: CustomTheme = {
      ...theme,
      id: this.generateId(),
      createdAt: new Date(),
      source: "custom",
    };

    const existingThemes = this.getCustomThemes();
    const updatedThemes = [...existingThemes, newTheme];

    localStorage.setItem(this.THEMES_KEY, JSON.stringify(updatedThemes));
    return newTheme;
  }

  updateCustomTheme(id: string, updates: Partial<CustomTheme>): boolean {
    const themes = this.getCustomThemes();
    const themeIndex = themes.findIndex((t) => t.id === id);

    if (themeIndex === -1) return false;

    themes[themeIndex] = {
      ...themes[themeIndex],
      ...updates,
      modifiedAt: new Date(),
    };

    localStorage.setItem(this.THEMES_KEY, JSON.stringify(themes));
    return true;
  }

  deleteCustomTheme(id: string): boolean {
    const themes = this.getCustomThemes();
    const filteredThemes = themes.filter((t) => t.id !== id);

    if (filteredThemes.length === themes.length) return false;

    localStorage.setItem(this.THEMES_KEY, JSON.stringify(filteredThemes));
    return true;
  }

  duplicateTheme(id: string, newName?: string): CustomTheme | null {
    const allThemes = this.getAllThemes();
    const originalTheme = allThemes.find((t) => t.id === id);

    if (!originalTheme) return null;

    const duplicatedTheme = this.saveCustomTheme({
      name: newName || `${originalTheme.name} (Copy)`,
      description: originalTheme.description,
      source: "custom",
      colors: {...originalTheme.colors},
      tags: originalTheme.tags ? [...originalTheme.tags] : undefined,
    });

    return duplicatedTheme;
  }
  getCustomFonts(): CustomFont[] {
    try {
      const stored = localStorage.getItem(this.FONTS_KEY);
      if (!stored) return [];

      const fonts = JSON.parse(stored);

      if (typeof fonts === "object" && fonts !== null) {
        return (fonts as CustomFont[]).map((font) => ({
          ...font,
          createdAt: new Date(font.createdAt),
        })) as CustomFont[];
      }

      return [];
    } catch (error) {
      console.error("Failed to load custom fonts:", error);
      return [];
    }
  }

  getAllFonts(): CustomFont[] {
    const builtInFonts: CustomFont[] = Object.entries(fonts).map(
      ([id, config]) => ({
        id,
        name: config.name,
        family: config.family,
        source: "system" as const,
        ligatures: config.ligatures,
        weight: config.weight,
        style: "normal" as const,
        createdAt: new Date("2024-01-01"),
      }),
    );

    const customFonts = this.getCustomFonts();
    return [...builtInFonts, ...customFonts];
  }

  async saveCustomFont(
    fontFile: File,
    options: {
      name?: string;
      ligatures?: boolean;
      weight?: string;
    } = {},
  ): Promise<CustomFont> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const fontData = reader.result as string;
          const fontName =
            options.name || fontFile.name.replace(/\.[^/.]+$/, "");

          const newFont: CustomFont = {
            id: this.generateId(),
            name: fontName,
            family: `"${fontName}", monospace`,
            source: "custom",
            data: fontData,
            ligatures: options.ligatures || false,
            weight: options.weight || "400",
            style: "normal",
            createdAt: new Date(),
            size: fontFile.size,
          };

          this.loadCustomFontCSS(newFont);

          const existingFonts = this.getCustomFonts();
          const updatedFonts = [...existingFonts, newFont];

          localStorage.setItem(this.FONTS_KEY, JSON.stringify(updatedFonts));
          resolve(newFont);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read font file"));
      reader.readAsDataURL(fontFile);
    });
  }

  private loadCustomFontCSS(font: CustomFont) {
    if (!font.data) return;

    const fontFace = `
      @font-face {
        font-family: "${font.name}";
        src: url("${font.data}");
        font-weight: ${font.weight};
        font-style: ${font.style};
        font-display: swap;
      }
    `;

    const existingStyle = document.getElementById(`custom-font-${font.id}`);
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement("style");
    style.id = `custom-font-${font.id}`;
    style.textContent = fontFace;
    document.head.appendChild(style);
  }

  deleteCustomFont(id: string): boolean {
    const fonts = this.getCustomFonts();
    const filteredFonts = fonts.filter((f) => f.id !== id);

    if (filteredFonts.length === fonts.length) return false;

    const styleElement = document.getElementById(`custom-font-${id}`);
    if (styleElement) {
      styleElement.remove();
    }

    localStorage.setItem(this.FONTS_KEY, JSON.stringify(filteredFonts));
    return true;
  }

  loadAllCustomFonts() {
    const customFonts = this.getCustomFonts();
    customFonts.forEach((font) => this.loadCustomFontCSS(font));
  }

  getSettings(): CustomizationSettings {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (!stored) return this.getDefaultSettings();

      const parsed = JSON.parse(stored);

      if (typeof parsed === "object" && parsed !== null) {
        return {...this.getDefaultSettings(), ...parsed};
      }

      return this.getDefaultSettings();
    } catch (error) {
      console.error("Failed to load customization settings:", error);
      return this.getDefaultSettings();
    }
  }

  saveSettings(settings: Partial<CustomizationSettings>) {
    const currentSettings = this.getSettings();
    const updatedSettings = {...currentSettings, ...settings};

    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));
  }

  private getDefaultSettings(): CustomizationSettings {
    return {
      currentTheme: "dark",
      currentFont: "jetbrains-mono",
      autoSave: true,
      previewMode: false,
      animations: true,
      fontSize: 16,
      lineHeight: 1.6,
      letterSpacing: 0,
    };
  }

  exportThemes(themeIds?: string[]): ThemeExport {
    const allThemes = this.getAllThemes();
    const themesToExport = themeIds
      ? allThemes.filter((t) => themeIds.includes(t.id))
      : allThemes.filter((t) => t.source === "custom");

    return {
      version: "1.0.0",
      themes: themesToExport,
      exportedAt: new Date(),
      exportedBy: "Terminal Portfolio",
    };
  }

  async importThemes(file: File): Promise<{success: number; errors: string[]}> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as ThemeExport;
          let success = 0;
          const errors: string[] = [];

          data.themes.forEach((theme) => {
            try {
              if (!this.validateTheme(theme)) {
                errors.push(`Invalid theme structure: ${theme.name}`);
                return;
              }

              const existingThemes = this.getCustomThemes();
              const duplicate = existingThemes.find(
                (t) => t.name === theme.name,
              );

              if (duplicate) {
                this.updateCustomTheme(duplicate.id, {
                  ...theme,
                  id: duplicate.id,
                  source: "imported" as const,
                });
              } else {
                this.saveCustomTheme({
                  ...theme,
                  source: "imported" as const,
                });
              }

              success++;
            } catch (error) {
              errors.push(`Failed to import theme ${theme.name}: ${error}`);
            }
          });

          resolve({success, errors});
        } catch (error) {
          reject(new Error("Invalid theme file format"));
        }
      };

      reader.onerror = () => reject(new Error("Failed to read theme file"));
      reader.readAsText(file);
    });
  }

  private validateTheme(
    theme: Partial<CustomTheme> | null | undefined,
  ): boolean {
    return Boolean(
      theme &&
      typeof theme.name === "string" &&
      theme.colors &&
      typeof theme.colors.bg === "string" &&
      typeof theme.colors.text === "string" &&
      typeof theme.colors.prompt === "string" &&
      typeof theme.colors.success === "string" &&
      typeof theme.colors.error === "string" &&
      typeof theme.colors.accent === "string" &&
      typeof theme.colors.border === "string",
    );
  }

  private generateId(): string {
    return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  resetToDefaults() {
    localStorage.removeItem(this.THEMES_KEY);
    localStorage.removeItem(this.FONTS_KEY);
    localStorage.removeItem(this.SETTINGS_KEY);

    const customStyles = document.querySelectorAll('[id^="custom-font-"]');
    customStyles.forEach((style) => style.remove());
  }

  searchThemes(query: string, tags?: string[]): CustomTheme[] {
    const allThemes = this.getAllThemes();
    const lowerQuery = query.toLowerCase();

    return allThemes.filter((theme) => {
      const matchesQuery =
        !query ||
        theme.name.toLowerCase().includes(lowerQuery) ||
        theme.description?.toLowerCase().includes(lowerQuery) ||
        theme.author?.toLowerCase().includes(lowerQuery);

      const matchesTags =
        !tags?.length || tags.some((tag) => theme.tags?.includes(tag));

      return matchesQuery && matchesTags;
    });
  }

  searchFonts(query: string): CustomFont[] {
    const allFonts = this.getAllFonts();
    const lowerQuery = query.toLowerCase();

    return allFonts.filter(
      (font) =>
        font.name.toLowerCase().includes(lowerQuery) ||
        font.family.toLowerCase().includes(lowerQuery),
    );
  }
}
