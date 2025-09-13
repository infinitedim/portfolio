import { describe, it, expect } from "vitest";
import { TypoTolerance } from "../typoTolerance";

describe("TypoTolerance", () => {
  it("levenshteinDistance basic cases", () => {
    expect(
      TypoTolerance.levenshteinDistance("kitten", "sitting"),
    ).toBeGreaterThan(0);
    expect(TypoTolerance.levenshteinDistance("a", "a")).toBe(0);
  });

  it("findSimilarCommand finds close command", () => {
    const cmd = TypoTolerance.findSimilarCommand("helo", ["help", "hello"]);
    expect(["hello", "help"]).toContain(cmd);
  });

  it("fuzzyMatch and suggestion score/type", () => {
    const matches = TypoTolerance.fuzzyMatch("hel", ["help", "hello", "world"]);
    expect(Array.isArray(matches)).toBe(true);
    expect(TypoTolerance.getSuggestionScore("hel", "help")).toBeGreaterThan(0);
    expect(TypoTolerance.getSuggestionType("hel", "help")).toBe("prefix");
  });
});
