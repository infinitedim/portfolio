import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  themes,
  defaultTheme,
  getSortedThemeNames,
  getThemeConfig,
  validateTheme,
  getThemePreview,
} from "@/lib/themes/theme-config";

describe("themeConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure themes is properly imported
    expect(themes).toBeDefined();
    expect(typeof themes).toBe("object");
    expect(Object.keys(themes).length).toBeGreaterThan(0);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("themes object", () => {
    it("should be defined and exportable", () => {
      expect(themes).toBeDefined();
      expect(typeof themes).toBe("object");
    });

    it("should have default theme", () => {
      expect(themes.default).toBeDefined();
      expect(themes.default.name).toBe("Default Dark");
      expect(themes.default.colors).toBeDefined();
      expect(themes.default.description).toBe("Classic terminal dark theme");
    });

    it("should have multiple themes", () => {
      expect(themes).toBeDefined();
      expect(typeof themes).toBe("object");
      const themeNames = Object.keys(themes);
      // Should have at least 10 themes
      expect(themeNames.length).toBeGreaterThan(10);
    });

    it("should have consistent theme structure", () => {
      const themeNames = Object.keys(themes);
      expect(themeNames.length).toBeGreaterThan(0);

      themeNames.forEach((themeName) => {
        const theme = themes[themeName as keyof typeof themes];
        expect(theme).toBeDefined();
        if (!theme) return;
        expect(theme).toBeDefined();
        if (theme) {
          expect(theme).toHaveProperty("name");
          expect(theme).toHaveProperty("colors");
          expect(theme).toHaveProperty("description");

          expect(typeof theme.name).toBe("string");
          expect(typeof theme.colors).toBe("object");
          expect(typeof theme.description).toBe("string");
        }
      });
    });

    it("should have consistent color structure", () => {
      const themeNames = Object.keys(themes);
      expect(themeNames.length).toBeGreaterThan(0);

      themeNames.forEach((themeName) => {
        const theme = themes[themeName as keyof typeof themes];
        expect(theme).toBeDefined();
        if (!theme) return;
        expect(theme).toBeDefined();
        if (!theme) return;
        const colors = theme.colors;

        expect(colors).toHaveProperty("bg");
        expect(colors).toHaveProperty("text");
        expect(colors).toHaveProperty("accent");
        expect(colors).toHaveProperty("muted");
        expect(colors).toHaveProperty("border");
        expect(colors).toHaveProperty("success");
        expect(colors).toHaveProperty("error");
        expect(colors).toHaveProperty("warning");
        expect(colors).toHaveProperty("info");
        expect(colors).toHaveProperty("prompt");

        // All colors should be valid hex strings
        Object.values(colors).forEach((color) => {
          expect(typeof color).toBe("string");
          expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
        });
      });
    });

    it("should have unique theme names", () => {
      const themeNames = Object.keys(themes);
      const uniqueNames = new Set(themeNames);
      expect(uniqueNames.size).toBe(themeNames.length);
    });

    it("should have valid hex color codes", () => {
      const themeNames = Object.keys(themes);
      expect(themeNames.length).toBeGreaterThan(0);

      themeNames.forEach((themeName) => {
        const theme = themes[themeName as keyof typeof themes];
        expect(theme).toBeDefined();
        if (!theme) return;
        expect(theme).toBeDefined();
        if (!theme) return;
        const colors = theme.colors;

        Object.entries(colors).forEach(([_, colorValue]) => {
          expect(colorValue).toMatch(/^#[0-9a-fA-F]{6}$/);
        });
      });
    });

    it("should have specific popular themes", () => {
      const expectedThemes = [
        "default",
        "matrix",
        "cyberpunk",
        "dracula",
        "monokai",
      ];

      expectedThemes.forEach((themeName) => {
        expect(themes[themeName as keyof typeof themes]).toBeDefined();
      });
    });
  });

  describe("defaultTheme constant", () => {
    it("should be defined and exportable", () => {
      expect(defaultTheme).toBeDefined();
      expect(typeof defaultTheme).toBe("string");
    });

    it("should be 'default'", () => {
      expect(defaultTheme).toBe("default");
    });

    it("should correspond to an existing theme", () => {
      expect(themes[defaultTheme]).toBeDefined();
    });
  });

  describe("getSortedThemeNames function", () => {
    it("should be defined and exportable", () => {
      expect(getSortedThemeNames).toBeDefined();
      expect(typeof getSortedThemeNames).toBe("function");
    });

    it("should return an array", () => {
      const result = getSortedThemeNames();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return all theme names", () => {
      const result = getSortedThemeNames();
      const expectedCount = Object.keys(themes).length;
      expect(result.length).toBe(expectedCount);
    });

    it("should return sorted theme names", () => {
      const result = getSortedThemeNames();
      const sortedResult = [...result].sort();
      expect(result).toEqual(sortedResult);
    });

    it("should return theme names as strings", () => {
      const result = getSortedThemeNames();
      result.forEach((themeName: string) => {
        expect(typeof themeName).toBe("string");
      });
    });

    it("should include default theme", () => {
      const result = getSortedThemeNames();
      expect(result).toContain("default");
    });

    it("should include popular themes", () => {
      const result = getSortedThemeNames();
      const popularThemes = ["cyberpunk", "dracula", "matrix", "monokai"];

      popularThemes.forEach((theme) => {
        expect(result).toContain(theme);
      });
    });

    it("should return consistent results", () => {
      const result1 = getSortedThemeNames();
      const result2 = getSortedThemeNames();
      expect(result1).toEqual(result2);
    });
  });

  describe("getThemeConfig function", () => {
    it("should be defined and exportable", () => {
      expect(getThemeConfig).toBeDefined();
      expect(typeof getThemeConfig).toBe("function");
    });

    it("should return theme config for valid theme", () => {
      const result = getThemeConfig("default");
      expect(result).toBeDefined();
      expect(result.name).toBe("Default Dark");
      expect(result.colors).toBeDefined();
    });

    it("should return default theme for invalid theme", () => {
      const result = getThemeConfig("nonexistent" as any);
      expect(result).toBeDefined();
      expect(result.name).toBe("Default Dark");
      expect(result.colors).toBeDefined();
    });

    it("should return correct theme for matrix", () => {
      const result = getThemeConfig("matrix");
      expect(result.name).toBe("Matrix");
      expect(result.colors.bg).toBe("#000000");
      expect(result.colors.text).toBe("#00ff41");
    });

    it("should return correct theme for cyberpunk", () => {
      const result = getThemeConfig("cyberpunk");
      expect(result.name).toBe("Cyberpunk");
      expect(result.colors.bg).toBe("#0f0f23");
      expect(result.colors.text).toBe("#ff00ff");
    });

    it("should return correct theme for dracula", () => {
      const result = getThemeConfig("dracula");
      expect(result.name).toBe("Dracula");
      expect(result.colors.bg).toBe("#282a36");
      expect(result.colors.text).toBe("#f8f8f2");
    });

    it("should handle all valid themes", () => {
      const themeNames = Object.keys(themes);
      expect(themeNames.length).toBeGreaterThan(0);

      themeNames.forEach((themeName) => {
        const result = getThemeConfig(themeName as any);
        expect(result).toBeDefined();
        const originalTheme = themes[themeName as keyof typeof themes];
        if (originalTheme) {
          expect(result.name).toBe(originalTheme.name);
        }
      });
    });

    it("should return consistent structure for all themes", () => {
      const themeNames = Object.keys(themes);

      themeNames.forEach((themeName) => {
        const result = getThemeConfig(themeName as any);
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("colors");
        expect(result).toHaveProperty("description");
      });
    });
  });

  describe("validateTheme function", () => {
    it("should be defined and exportable", () => {
      expect(validateTheme).toBeDefined();
      expect(typeof validateTheme).toBe("function");
    });

    it("should return true for valid themes", () => {
      const validThemes = ["default", "matrix", "cyberpunk", "dracula"];

      validThemes.forEach((theme) => {
        expect(validateTheme(theme)).toBe(true);
      });
    });

    it("should return false for invalid themes", () => {
      const invalidThemes = ["nonexistent", "invalid", "test", ""];

      invalidThemes.forEach((theme) => {
        expect(validateTheme(theme)).toBe(false);
      });
    });

    it("should handle case sensitivity", () => {
      expect(validateTheme("DEFAULT")).toBe(false);
      expect(validateTheme("Matrix")).toBe(false);
      expect(validateTheme("CYBERPUNK")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(validateTheme("")).toBe(false);
      expect(validateTheme(" ")).toBe(false);
      expect(validateTheme("default ")).toBe(false);
      expect(validateTheme(" default")).toBe(false);
    });

    it("should validate all existing themes", () => {
      const themeNames = Object.keys(themes);

      themeNames.forEach((themeName) => {
        expect(validateTheme(themeName)).toBe(true);
      });
    });

    it("should handle null and undefined", () => {
      expect(validateTheme(null as any)).toBe(false);
      expect(validateTheme(undefined as any)).toBe(false);
    });
  });

  describe("getThemePreview function", () => {
    it("should be defined and exportable", () => {
      expect(getThemePreview).toBeDefined();
      expect(typeof getThemePreview).toBe("function");
    });

    it("should return preview for valid theme", () => {
      const result = getThemePreview("default");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain("🎨 Default Dark");
      expect(result).toContain("Background:");
      expect(result).toContain("Text:");
      expect(result).toContain("Accent:");
    });

    it("should return empty string for invalid theme", () => {
      const result = getThemePreview("nonexistent" as any);
      expect(result).toBe("");
    });

    it("should include theme name in preview", () => {
      const result = getThemePreview("matrix");
      expect(result).toContain("🎨 Matrix");
    });

    it("should include color information in preview", () => {
      const result = getThemePreview("cyberpunk");
      expect(result).toContain("Background:");
      expect(result).toContain("Text:");
      expect(result).toContain("Accent:");
    });

    it("should include description in preview", () => {
      const result = getThemePreview("dracula");
      expect(result).toContain("Popular Dracula color scheme");
    });

    it("should handle all valid themes", () => {
      const themeNames = Object.keys(themes);

      themeNames.forEach((themeName) => {
        const result = getThemePreview(themeName as any);
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
        expect(result).toContain("🎨");
        expect(result).toContain("Background:");
        expect(result).toContain("Text:");
        expect(result).toContain("Accent:");
      });
    });

    it("should have consistent format", () => {
      const result = getThemePreview("default");
      const lines = result.split(" | ");
      expect(lines.length).toBeGreaterThanOrEqual(4);
      expect(lines[0]).toContain("🎨");
      expect(lines[1]).toContain("Background:");
      expect(lines[2]).toContain("Text:");
      expect(lines[3]).toContain("Accent:");
    });

    it("should include description when available", () => {
      const result = getThemePreview("default");
      expect(result).toContain("Classic terminal dark theme");
    });

    it("should handle themes with different descriptions", () => {
      const matrixResult = getThemePreview("matrix");
      const cyberpunkResult = getThemePreview("cyberpunk");

      expect(matrixResult).toContain("Green on black Matrix-style theme");
      expect(cyberpunkResult).toContain("Neon cyberpunk aesthetic");
    });
  });

  describe("theme color validation", () => {
    it("should have valid contrast ratios", () => {
      const themeNames = Object.keys(themes);

      themeNames.forEach((themeName) => {
        const theme = themes[themeName as keyof typeof themes];
        expect(theme).toBeDefined();
        if (!theme) return;
        expect(theme).toBeDefined();
        if (!theme) return;
        const { bg, text } = theme.colors;

        // Basic validation that bg and text are different
        expect(bg).not.toBe(text);
      });
    });

    it("should have consistent color naming", () => {
      const themeNames = Object.keys(themes);

      themeNames.forEach((themeName) => {
        const theme = themes[themeName as keyof typeof themes];
        expect(theme).toBeDefined();
        if (!theme) return;
        expect(theme).toBeDefined();
        if (!theme) return;
        const colorKeys = Object.keys(theme.colors);

        const expectedKeys = [
          "bg",
          "text",
          "accent",
          "muted",
          "border",
          "success",
          "error",
          "warning",
          "info",
          "prompt",
        ];

        expect(colorKeys.sort()).toEqual(expectedKeys.sort());
      });
    });

    it("should have reasonable color values", () => {
      const themeNames = Object.keys(themes);

      themeNames.forEach((themeName) => {
        const theme = themes[themeName as keyof typeof themes];
        expect(theme).toBeDefined();
        if (!theme) return;
        expect(theme).toBeDefined();
        if (!theme) return;
        const colors = theme.colors;

        Object.entries(colors).forEach(([colorName, colorValue]) => {
          // Should be valid hex color
          expect(colorValue).toMatch(/^#[0-9a-fA-F]{6}$/);

          // Should not be pure white or pure black for most colors
          if (colorName !== "bg" && colorName !== "text") {
            expect(colorValue).not.toBe("#ffffff");
            expect(colorValue).not.toBe("#000000");
          }
        });
      });
    });
  });

  describe("theme descriptions", () => {
    it("should have meaningful descriptions", () => {
      const themeNames = Object.keys(themes);

      themeNames.forEach((themeName) => {
        const theme = themes[themeName as keyof typeof themes];
        expect(theme).toBeDefined();
        if (!theme) return;
        expect(theme.description?.length).toBeGreaterThan(0);
        expect(theme.description?.length).toBeLessThan(100);
      });
    });

    it("should have unique descriptions", () => {
      const descriptions = Object.values(themes).map(
        (theme: { description?: string }) => theme.description,
      );
      const uniqueDescriptions = new Set(descriptions);
      expect(uniqueDescriptions.size).toBe(descriptions.length);
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle null theme name in getThemeConfig", () => {
      const result = getThemeConfig(null as any);
      expect(result).toBeDefined();
      expect(result.name).toBe("Default Dark");
    });

    it("should handle undefined theme name in getThemeConfig", () => {
      const result = getThemeConfig(undefined as any);
      expect(result).toBeDefined();
      expect(result.name).toBe("Default Dark");
    });

    it("should handle empty string in validateTheme", () => {
      expect(validateTheme("")).toBe(false);
    });

    it("should handle whitespace in validateTheme", () => {
      expect(validateTheme(" ")).toBe(false);
      expect(validateTheme("  default  ")).toBe(false);
    });

    it("should handle null in getThemePreview", () => {
      const result = getThemePreview(null as any);
      expect(result).toBe("");
    });

    it("should handle undefined in getThemePreview", () => {
      const result = getThemePreview(undefined as any);
      expect(result).toBe("");
    });
  });

  describe("integration tests", () => {
    it("should work together correctly", () => {
      const themeNames = getSortedThemeNames();
      const validTheme = themeNames[0];

      expect(validateTheme(validTheme)).toBe(true);

      const config = getThemeConfig(validTheme);
      expect(config).toBeDefined();

      const preview = getThemePreview(validTheme);
      expect(preview).toContain(config.name);
    });

    it("should handle invalid theme gracefully", () => {
      expect(validateTheme("invalid")).toBe(false);

      const config = getThemeConfig("invalid" as any);
      expect(config.name).toBe("Default Dark");

      const preview = getThemePreview("invalid" as any);
      expect(preview).toBe("");
    });

    it("should maintain consistency across functions", () => {
      const themeNames = getSortedThemeNames();

      themeNames.forEach((themeName) => {
        expect(validateTheme(themeName)).toBe(true);

        const config = getThemeConfig(themeName as any);
        const originalTheme = themes[themeName as keyof typeof themes];
        if (originalTheme) {
          expect(config.name).toBe(originalTheme.name);
        }

        const preview = getThemePreview(themeName as any);
        expect(preview).toContain(config.name);
      });
    });
  });
});
