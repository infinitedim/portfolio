import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ThemeDisplay, ThemeDisplayOptions } from "../theme-display";

describe("themeDisplay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("ThemeDisplay class", () => {
    it("should be defined and exportable", () => {
      expect(ThemeDisplay).toBeDefined();
      expect(typeof ThemeDisplay).toBe("function");
    });

    it("should have static generateList method", () => {
      expect(ThemeDisplay.generateList).toBeDefined();
      expect(typeof ThemeDisplay.generateList).toBe("function");
    });

    it("should have static generateColorPreview method", () => {
      expect(ThemeDisplay.generateColorPreview).toBeDefined();
      expect(typeof ThemeDisplay.generateColorPreview).toBe("function");
    });

    it("should have static generateThemeComparison method", () => {
      expect(ThemeDisplay.generateThemeComparison).toBeDefined();
      expect(typeof ThemeDisplay.generateThemeComparison).toBe("function");
    });
  });

  describe("ThemeDisplayOptions interface", () => {
    it("should accept valid options", () => {
      const options: ThemeDisplayOptions = {
        showCurrent: true,
        currentTheme: "dark" as any,
        compact: false,
        showColors: true,
        columns: 2,
      };

      expect(options.showCurrent).toBe(true);
      expect(options.currentTheme).toBe("dark");
      expect(options.compact).toBe(false);
      expect(options.showColors).toBe(true);
      expect(options.columns).toBe(2);
    });

    it("should allow partial options", () => {
      const options: ThemeDisplayOptions = {
        compact: true,
      };

      expect(options.compact).toBe(true);
      expect(options.showCurrent).toBeUndefined();
    });

    it("should allow empty options", () => {
      const options: ThemeDisplayOptions = {};
      expect(options).toEqual({});
    });
  });

  describe("generateList method", () => {
    it("should generate list with default options", () => {
      expect(() => ThemeDisplay.generateList()).not.toThrow();
      const result = ThemeDisplay.generateList();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should generate compact list", () => {
      const result = ThemeDisplay.generateList({ compact: true });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle showCurrent false", () => {
      const result = ThemeDisplay.generateList({
        currentTheme: "dark" as any,
        showCurrent: false,
      });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should use specified number of columns", () => {
      const result = ThemeDisplay.generateList({ columns: 1 });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle missing current theme gracefully", () => {
      const result = ThemeDisplay.generateList({
        showCurrent: true,
        currentTheme: undefined,
      });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle undefined options", () => {
      const result = ThemeDisplay.generateList(undefined);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle zero columns", () => {
      const result = ThemeDisplay.generateList({ columns: 0 });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle negative columns", () => {
      const result = ThemeDisplay.generateList({ columns: -1 });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle very large columns", () => {
      const result = ThemeDisplay.generateList({ columns: 100 });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("generateColorPreview method", () => {
    it("should handle valid theme names", () => {
      // Test that method doesn't throw and returns a string
      expect(() =>
        ThemeDisplay.generateColorPreview("dark" as any),
      ).not.toThrow();
      const result = ThemeDisplay.generateColorPreview("dark" as any);
      expect(typeof result).toBe("string");
    });

    it("should handle invalid theme names", () => {
      const result = ThemeDisplay.generateColorPreview("nonexistent" as any);
      expect(typeof result).toBe("string");
    });

    it("should return consistent output type", () => {
      const result1 = ThemeDisplay.generateColorPreview("light" as any);
      const result2 = ThemeDisplay.generateColorPreview("invalid" as any);

      expect(typeof result1).toBe("string");
      expect(typeof result2).toBe("string");
    });
  });

  describe("generateThemeComparison method", () => {
    it("should handle empty themes array", () => {
      const result = ThemeDisplay.generateThemeComparison([]);
      expect(result).toBe("No themes to compare");
    });

    it("should handle single theme", () => {
      const result = ThemeDisplay.generateThemeComparison(["dark"] as any[]);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle multiple themes", () => {
      const result = ThemeDisplay.generateThemeComparison([
        "dark",
        "light",
      ] as any[]);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle invalid themes gracefully", () => {
      const result = ThemeDisplay.generateThemeComparison([
        "nonexistent",
      ] as any[]);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return consistent output format", () => {
      const result = ThemeDisplay.generateThemeComparison([
        "dark",
        "light",
        "cyberpunk",
      ] as any[]);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("error handling and edge cases", () => {
    it("should handle null current theme", () => {
      const result = ThemeDisplay.generateList({
        currentTheme: null as any,
        showCurrent: true,
      });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return string output", () => {
      const result = ThemeDisplay.generateList();
      expect(typeof result).toBe("string");
    });

    it("should have proper line breaks", () => {
      const result = ThemeDisplay.generateList();
      expect(result).toContain("\n");
    });

    it("should handle all method calls without throwing", () => {
      expect(() => ThemeDisplay.generateList()).not.toThrow();
      expect(() =>
        ThemeDisplay.generateColorPreview("test" as any),
      ).not.toThrow();
      expect(() => ThemeDisplay.generateThemeComparison([])).not.toThrow();
      expect(() =>
        ThemeDisplay.generateThemeComparison(["test"] as any[]),
      ).not.toThrow();
    });
  });

  describe("output formatting", () => {
    it("should return string output for all methods", () => {
      const list = ThemeDisplay.generateList();
      const preview = ThemeDisplay.generateColorPreview("test" as any);
      const comparison = ThemeDisplay.generateThemeComparison([
        "test",
      ] as any[]);

      expect(typeof list).toBe("string");
      expect(typeof preview).toBe("string");
      expect(typeof comparison).toBe("string");
    });

    it("should have consistent formatting", () => {
      const result = ThemeDisplay.generateList();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
