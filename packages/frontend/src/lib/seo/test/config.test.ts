import { describe, it, expect } from "vitest";
import { SEO_HELPERS, SEO_CONFIG } from "../config";

describe("SEO_HELPERS", () => {
  it("getPageTitle falls back to site title", () => {
    const title = SEO_HELPERS.getPageTitle("nonexistent");
    expect(title).toBe(SEO_CONFIG.site.title);
  });

  it("getPageDescription returns custom if provided", () => {
    const desc = SEO_HELPERS.getPageDescription("home", "custom desc");
    expect(desc).toBe("custom desc");
  });

  it("getPageKeywords returns array and falls back to home keywords", () => {
    const keys = SEO_HELPERS.getPageKeywords("nonpage");
    expect(Array.isArray(keys)).toBe(true);
  });

  it("getCanonicalUrl and getOGImage produce full URLs", () => {
    const url = SEO_HELPERS.getCanonicalUrl("/test");
    expect(url).toContain(SEO_CONFIG.site.url);

    const og = SEO_HELPERS.getOGImage("projects");
    expect(og).toContain(SEO_CONFIG.site.url);
  });
});
