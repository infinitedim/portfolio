import { describe, it, expect } from "vitest";
import {
  LazyCustomizationManager,
  LazyThemeEditor,
  LazyFontManager,
  LazyRoadmapVisualizer,
  LazyLoadingFallback,
} from "../lazy-index";

describe("LazyIndex", () => {
  describe("Exports", () => {
    it("should export LazyCustomizationManager", () => {
      expect(LazyCustomizationManager).toBeDefined();
    });

    it("should export LazyThemeEditor", () => {
      expect(LazyThemeEditor).toBeDefined();
    });

    it("should export LazyFontManager", () => {
      expect(LazyFontManager).toBeDefined();
    });

    it("should export LazyRoadmapVisualizer", () => {
      expect(LazyRoadmapVisualizer).toBeDefined();
    });

    it("should export LazyLoadingFallback", () => {
      expect(LazyLoadingFallback).toBeDefined();
    });
  });
});
