import { describe, it, expect } from "vitest";
import { fonts, getSortedFontNames, defaultFont } from "@/lib/fonts/font-config";

describe("fontConfig", () => {

  it("exports available fonts and default", () => {
    const names = getSortedFontNames();
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBe(Object.keys(fonts).length);
    expect(names).toContain(defaultFont);
  });

  it("each font has expected properties", () => {
    for (const key of Object.keys(fonts)) {
      const f = (fonts as any)[key];
      expect(f).toHaveProperty("name");
      expect(f).toHaveProperty("family");
      expect(typeof f.ligatures).toBe("boolean");
      expect(typeof f.weight).toBe("string");
    }
  });
});
