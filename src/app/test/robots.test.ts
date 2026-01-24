import { describe, it, expect, beforeEach, vi } from "vitest";
import robots from "../robots";

describe("robots.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variable
    delete process.env.NEXT_PUBLIC_BASE_URL;
  });

  describe("Default Configuration", () => {
    it("should return robots configuration object", () => {
      const result = robots();
      expect(result).toBeDefined();
      expect(result).toHaveProperty("rules");
      expect(result).toHaveProperty("sitemap");
      expect(result).toHaveProperty("host");
    });

    it("should use default base URL when env var is not set", () => {
      const result = robots();
      expect(result.host).toBe("https://infinitedim.site");
      expect(result.sitemap).toBe("https://infinitedim.site/sitemap.xml");
    });

    it("should use NEXT_PUBLIC_BASE_URL when set", () => {
      process.env.NEXT_PUBLIC_BASE_URL = "https://example.com";
      const result = robots();
      expect(result.host).toBe("https://example.com");
      expect(result.sitemap).toBe("https://example.com/sitemap.xml");
    });
  });

  describe("Universal Rules (*)", () => {
    it("should have universal rule for all user agents", () => {
      const result = robots();
      const universalRule = result.rules.find((rule) => rule.userAgent === "*");
      expect(universalRule).toBeDefined();
    });

    it("should allow public routes", () => {
      const result = robots();
      const universalRule = result.rules.find((rule) => rule.userAgent === "*");
      expect(universalRule?.allow).toContain("/");
      expect(universalRule?.allow).toContain("/projects");
      expect(universalRule?.allow).toContain("/skills");
      expect(universalRule?.allow).toContain("/about");
      expect(universalRule?.allow).toContain("/contact");
    });

    it("should disallow private routes", () => {
      const result = robots();
      const universalRule = result.rules.find((rule) => rule.userAgent === "*");
      expect(universalRule?.disallow).toContain("/api/");
      expect(universalRule?.disallow).toContain("/admin/");
      expect(universalRule?.disallow).toContain("/private/");
      expect(universalRule?.disallow).toContain("/_next/");
    });

    it("should have crawl delay for universal rule", () => {
      const result = robots();
      const universalRule = result.rules.find((rule) => rule.userAgent === "*");
      expect(universalRule?.crawlDelay).toBe(1);
    });
  });

  describe("Googlebot Rules", () => {
    it("should have specific rule for Googlebot", () => {
      const result = robots();
      const googlebotRule = result.rules.find(
        (rule) => rule.userAgent === "Googlebot",
      );
      expect(googlebotRule).toBeDefined();
    });

    it("should allow public routes for Googlebot", () => {
      const result = robots();
      const googlebotRule = result.rules.find(
        (rule) => rule.userAgent === "Googlebot",
      );
      expect(googlebotRule?.allow).toContain("/");
      expect(googlebotRule?.allow).toContain("/projects");
    });

    it("should disallow private routes for Googlebot", () => {
      const result = robots();
      const googlebotRule = result.rules.find(
        (rule) => rule.userAgent === "Googlebot",
      );
      expect(googlebotRule?.disallow).toContain("/api/");
      expect(googlebotRule?.disallow).toContain("/admin/");
    });

    it("should have crawl delay for Googlebot", () => {
      const result = robots();
      const googlebotRule = result.rules.find(
        (rule) => rule.userAgent === "Googlebot",
      );
      expect(googlebotRule?.crawlDelay).toBe(1);
    });
  });

  describe("Googlebot-Image Rules", () => {
    it("should have specific rule for Googlebot-Image", () => {
      const result = robots();
      const googlebotImageRule = result.rules.find(
        (rule) => rule.userAgent === "Googlebot-Image",
      );
      expect(googlebotImageRule).toBeDefined();
    });

    it("should allow image routes for Googlebot-Image", () => {
      const result = robots();
      const googlebotImageRule = result.rules.find(
        (rule) => rule.userAgent === "Googlebot-Image",
      );
      expect(googlebotImageRule?.allow).toContain("/images/");
      expect(googlebotImageRule?.allow).toContain("/og-image.png");
      expect(googlebotImageRule?.allow).toContain("/avatar.jpg");
    });
  });

  describe("Googlebot-Mobile Rules", () => {
    it("should have specific rule for Googlebot-Mobile", () => {
      const result = robots();
      const googlebotMobileRule = result.rules.find(
        (rule) => rule.userAgent === "Googlebot-Mobile",
      );
      expect(googlebotMobileRule).toBeDefined();
    });

    it("should allow public routes for Googlebot-Mobile", () => {
      const result = robots();
      const googlebotMobileRule = result.rules.find(
        (rule) => rule.userAgent === "Googlebot-Mobile",
      );
      expect(googlebotMobileRule?.allow).toContain("/");
      expect(googlebotMobileRule?.allow).toContain("/projects");
    });
  });

  describe("Bingbot Rules", () => {
    it("should have specific rule for Bingbot", () => {
      const result = robots();
      const bingbotRule = result.rules.find(
        (rule) => rule.userAgent === "Bingbot",
      );
      expect(bingbotRule).toBeDefined();
    });

    it("should allow public routes for Bingbot", () => {
      const result = robots();
      const bingbotRule = result.rules.find(
        (rule) => rule.userAgent === "Bingbot",
      );
      expect(bingbotRule?.allow).toContain("/");
      expect(bingbotRule?.allow).toContain("/projects");
    });

    it("should have crawl delay for Bingbot", () => {
      const result = robots();
      const bingbotRule = result.rules.find(
        (rule) => rule.userAgent === "Bingbot",
      );
      expect(bingbotRule?.crawlDelay).toBe(1);
    });
  });

  describe("Other Search Engine Bots", () => {
    it("should have rule for Slurp (Yahoo)", () => {
      const result = robots();
      const slurpRule = result.rules.find((rule) => rule.userAgent === "Slurp");
      expect(slurpRule).toBeDefined();
    });

    it("should have rule for DuckDuckBot", () => {
      const result = robots();
      const duckDuckBotRule = result.rules.find(
        (rule) => rule.userAgent === "DuckDuckBot",
      );
      expect(duckDuckBotRule).toBeDefined();
    });

    it("should have rule for CCBot (Common Crawl)", () => {
      const result = robots();
      const ccBotRule = result.rules.find((rule) => rule.userAgent === "CCBot");
      expect(ccBotRule).toBeDefined();
      expect(ccBotRule?.crawlDelay).toBe(10);
    });

    it("should have rule for AhrefsBot", () => {
      const result = robots();
      const ahrefsBotRule = result.rules.find(
        (rule) => rule.userAgent === "AhrefsBot",
      );
      expect(ahrefsBotRule).toBeDefined();
      expect(ahrefsBotRule?.crawlDelay).toBe(10);
    });

    it("should have rule for SemrushBot", () => {
      const result = robots();
      const semrushBotRule = result.rules.find(
        (rule) => rule.userAgent === "SemrushBot",
      );
      expect(semrushBotRule).toBeDefined();
      expect(semrushBotRule?.crawlDelay).toBe(10);
    });

    it("should have rule for MJ12bot", () => {
      const result = robots();
      const mj12botRule = result.rules.find(
        (rule) => rule.userAgent === "MJ12bot",
      );
      expect(mj12botRule).toBeDefined();
      expect(mj12botRule?.crawlDelay).toBe(10);
    });
  });

  describe("GPTBot Blocking", () => {
    it("should have rule for GPTBot", () => {
      const result = robots();
      const gptBotRule = result.rules.find(
        (rule) => rule.userAgent === "GPTBot",
      );
      expect(gptBotRule).toBeDefined();
    });

    it("should disallow all routes for GPTBot", () => {
      const result = robots();
      const gptBotRule = result.rules.find(
        (rule) => rule.userAgent === "GPTBot",
      );
      expect(gptBotRule?.disallow).toContain("/");
      expect(gptBotRule?.allow).toBeUndefined();
    });
  });

  describe("Sitemap Reference", () => {
    it("should include sitemap URL", () => {
      const result = robots();
      expect(result.sitemap).toBeDefined();
      expect(result.sitemap).toContain("/sitemap.xml");
    });

    it("should use correct base URL in sitemap", () => {
      process.env.NEXT_PUBLIC_BASE_URL = "https://test.com";
      const result = robots();
      expect(result.sitemap).toBe("https://test.com/sitemap.xml");
    });
  });

  describe("Host Configuration", () => {
    it("should include host property", () => {
      const result = robots();
      expect(result.host).toBeDefined();
    });

    it("should use correct base URL in host", () => {
      process.env.NEXT_PUBLIC_BASE_URL = "https://test.com";
      const result = robots();
      expect(result.host).toBe("https://test.com");
    });
  });
});
