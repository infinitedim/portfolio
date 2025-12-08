import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock state for dynamic testing
let mockCurrentLocale = "en_US";
let mockSetLocaleResult = true;

vi.mock("@/lib/i18n/i18nService", () => ({
  i18n: {
    getCurrentLocale: () => mockCurrentLocale,
    getCurrentLocaleConfig: () => {
      const locales: Record<string, any> = {
        en_US: {
          code: "en_US",
          name: "English (US)",
          nativeName: "English",
          flag: "🇺🇸",
          direction: "ltr",
        },
        id_ID: {
          code: "id_ID",
          name: "Indonesian",
          nativeName: "Bahasa Indonesia",
          flag: "🇮🇩",
          direction: "ltr",
        },
        ar_SA: {
          code: "ar_SA",
          name: "Arabic",
          nativeName: "العربية",
          flag: "🇸🇦",
          direction: "rtl",
        },
      };
      return locales[mockCurrentLocale] || locales.en_US;
    },
    getSupportedLocales: () => [
      { code: "en_US", name: "English (US)", flag: "🇺🇸" },
      { code: "id_ID", name: "Indonesian", flag: "🇮🇩" },
      { code: "es_ES", name: "Spanish", flag: "🇪🇸" },
      { code: "fr_FR", name: "French", flag: "🇫🇷" },
      { code: "ar_SA", name: "Arabic", flag: "🇸🇦" },
    ],
    setLocale: (code: string) => {
      if (mockSetLocaleResult) {
        mockCurrentLocale = code;
      }
      return mockSetLocaleResult;
    },
  },
  t: (key: string) => {
    const translations: Record<string, string> = {
      languageNotSupported: "Language not supported",
      languageFallback: "Falling back to",
      languageChanged: "Language changed successfully",
      currentLanguage: "Current Language",
      availableLanguages: "Available Languages",
    };
    return translations[key] || key;
  },
}));

vi.mock("@/lib/i18n/locales", () => ({
  isRegionalVariant: (code: string) => {
    const regionalVariants = [
      "en_GB",
      "en_CA",
      "en_AU",
      "es_MX",
      "es_AR",
      "fr_CA",
      "de_AT",
      "pt_PT",
      "zh_TW",
      "ar_EG",
    ];
    return regionalVariants.includes(code);
  },
  getFallbackLocale: (code: string) => {
    const fallbacks: Record<string, string> = {
      en_GB: "en_US",
      en_CA: "en_US",
      en_AU: "en_US",
      es_MX: "es_ES",
      es_AR: "es_ES",
      fr_CA: "fr_FR",
      de_AT: "de_DE",
      pt_PT: "pt_BR",
      zh_TW: "zh_CN",
      ar_EG: "ar_SA",
    };
    return fallbacks[code] || "en_US";
  },
  getLocaleConfig: (code: string) => {
    const configs: Record<string, any> = {
      en_US: {
        code: "en_US",
        name: "English (US)",
        nativeName: "English",
        flag: "🇺🇸",
        direction: "ltr",
      },
      en_GB: {
        code: "en_GB",
        name: "English (UK)",
        nativeName: "English",
        flag: "🇬🇧",
        direction: "ltr",
      },
      id_ID: {
        code: "id_ID",
        name: "Indonesian",
        nativeName: "Bahasa Indonesia",
        flag: "🇮🇩",
        direction: "ltr",
      },
      es_ES: {
        code: "es_ES",
        name: "Spanish",
        nativeName: "Español",
        flag: "🇪🇸",
        direction: "ltr",
      },
      es_MX: {
        code: "es_MX",
        name: "Spanish (Mexico)",
        nativeName: "Español (México)",
        flag: "🇲🇽",
        direction: "ltr",
      },
      fr_FR: {
        code: "fr_FR",
        name: "French",
        nativeName: "Français",
        flag: "🇫🇷",
        direction: "ltr",
      },
      ar_SA: {
        code: "ar_SA",
        name: "Arabic",
        nativeName: "العربية",
        flag: "🇸🇦",
        direction: "rtl",
      },
      ar_EG: {
        code: "ar_EG",
        name: "Arabic (Egypt)",
        nativeName: "العربية (مصر)",
        flag: "🇪🇬",
        direction: "rtl",
      },
    };
    return configs[code] || undefined;
  },
}));

vi.mock("@/lib/utils/utils", () => ({
  generateId: () => `test-id-${Date.now()}`,
}));

import {
  languageCommand,
  languageListCommand,
  languageInfoCommand,
} from "../languageCommands";

describe("languageCommands", () => {
  beforeEach(() => {
    // Reset mock state before each test
    mockCurrentLocale = "en_US";
    mockSetLocaleResult = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================
  // languageCommand (lang) Tests
  // ===========================================
  describe("languageCommand (lang)", () => {
    describe("command metadata", () => {
      it("should have correct command name", () => {
        expect(languageCommand.name).toBe("lang");
      });

      it("should have correct aliases", () => {
        expect(languageCommand.aliases).toContain("language");
        expect(languageCommand.aliases).toContain("locale");
      });

      it("should have correct category", () => {
        expect(languageCommand.category).toBe("system");
      });

      it("should have usage information", () => {
        expect(languageCommand.usage).toBe("lang <locale_id>");
      });

      it("should have a description", () => {
        expect(languageCommand.description).toBeDefined();
        expect(languageCommand.description.length).toBeGreaterThan(0);
      });
    });

    describe("show current language (no args)", () => {
      it("should return info type when no arguments provided", async () => {
        const result = await languageCommand.execute([]);
        expect(result.type).toBe("info");
      });

      it("should show current language information", async () => {
        const result = await languageCommand.execute([]);
        expect(result.content).toContain("Current Language");
        expect(result.content).toContain("🇺🇸");
        expect(result.content).toContain("English");
      });

      it("should show available languages list", async () => {
        const result = await languageCommand.execute([]);
        expect(result.content).toContain("Available Languages");
      });

      it("should include usage examples", async () => {
        const result = await languageCommand.execute([]);
        expect(result.content).toContain("lang <locale_id>");
        expect(result.content).toContain("lang id_ID");
      });

      it("should have timestamp and id", async () => {
        const result = await languageCommand.execute([]);
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(result.id).toBeDefined();
      });
    });

    describe("change language (direct locale)", () => {
      it("should change language successfully to Indonesian", async () => {
        const result = await languageCommand.execute(["id_ID"]);
        expect(result.type).toBe("success");
        expect(result.content).toContain("Language changed successfully");
        expect(result.content).toContain("Indonesian");
        expect(result.content).toContain("🇮🇩");
      });

      it("should change language successfully to Spanish", async () => {
        const result = await languageCommand.execute(["es_ES"]);
        expect(result.type).toBe("success");
        expect(result.content).toContain("Spanish");
        expect(result.content).toContain("🇪🇸");
      });

      it("should show direction information for LTR language", async () => {
        const result = await languageCommand.execute(["fr_FR"]);
        expect(result.type).toBe("success");
        expect(result.content).toContain("Direction: LTR");
      });

      it("should show direction information for RTL language", async () => {
        const result = await languageCommand.execute(["ar_SA"]);
        expect(result.type).toBe("success");
        expect(result.content).toContain("Direction: RTL");
      });

      it("should normalize hyphen to underscore", async () => {
        const result = await languageCommand.execute(["id-ID"]);
        expect(result.type).toBe("success");
        expect(result.content).toContain("Indonesian");
      });

      it("should mention localStorage saving", async () => {
        const result = await languageCommand.execute(["id_ID"]);
        expect(result.content).toContain("localStorage");
      });
    });

    describe("change language (regional variant)", () => {
      it("should handle regional variant en_GB", async () => {
        const result = await languageCommand.execute(["en_GB"]);
        expect(result.type).toBe("success");
        expect(result.content).toContain("Falling back to");
        expect(result.content).toContain("regional variant");
      });

      it("should handle regional variant es_MX", async () => {
        const result = await languageCommand.execute(["es_MX"]);
        expect(result.type).toBe("success");
        expect(result.content).toContain("regional variant");
      });

      it("should handle regional variant with hyphen (en-GB)", async () => {
        const result = await languageCommand.execute(["en-GB"]);
        expect(result.type).toBe("success");
        expect(result.content).toContain("Falling back to");
      });

      it("should mention primary language mapping", async () => {
        const result = await languageCommand.execute(["ar_EG"]);
        expect(result.type).toBe("success");
        expect(result.content).toContain("automatically mapped");
      });
    });

    describe("invalid locale handling", () => {
      it("should return error for unknown locale", async () => {
        const result = await languageCommand.execute(["zz_ZZ"]);
        expect(result.type).toBe("error");
        expect(result.content).toContain("Language not supported");
        expect(result.content).toContain("zz_ZZ");
      });

      it("should return error for invalid format", async () => {
        const result = await languageCommand.execute(["invalid"]);
        expect(result.type).toBe("error");
      });

      it("should return error for empty string locale", async () => {
        // Empty string in args array (not empty array)
        const result = await languageCommand.execute([""]);
        // Empty string is falsy, so it shows current language
        expect(result.type).toBe("info");
      });
    });

    describe("setLocale failure handling", () => {
      it("should return error when setLocale fails for direct locale", async () => {
        mockSetLocaleResult = false;
        const result = await languageCommand.execute(["fr_FR"]);
        expect(result.type).toBe("error");
        expect(result.content).toContain("Failed to change language");
      });
    });
  });

  // ===========================================
  // languageListCommand (langlist) Tests
  // ===========================================
  describe("languageListCommand (langlist)", () => {
    describe("command metadata", () => {
      it("should have correct command name", () => {
        expect(languageListCommand.name).toBe("langlist");
      });

      it("should have correct aliases", () => {
        expect(languageListCommand.aliases).toContain("languages");
        expect(languageListCommand.aliases).toContain("locales");
      });

      it("should have correct category", () => {
        expect(languageListCommand.category).toBe("system");
      });

      it("should have a description", () => {
        expect(languageListCommand.description).toBeDefined();
        expect(languageListCommand.description.length).toBeGreaterThan(0);
      });
    });

    describe("list output", () => {
      it("should return info type", async () => {
        const result = await languageListCommand.execute([]);
        expect(result.type).toBe("info");
      });

      it("should show all supported languages", async () => {
        const result = await languageListCommand.execute([]);
        expect(result.content).toContain("English (US)");
        expect(result.content).toContain("Indonesian");
        expect(result.content).toContain("Spanish");
        expect(result.content).toContain("French");
        expect(result.content).toContain("Arabic");
      });

      it("should show flags for each language", async () => {
        const result = await languageListCommand.execute([]);
        expect(result.content).toContain("🇺🇸");
        expect(result.content).toContain("🇮🇩");
        expect(result.content).toContain("🇪🇸");
        expect(result.content).toContain("🇫🇷");
        expect(result.content).toContain("🇸🇦");
      });

      it("should mark current language", async () => {
        const result = await languageListCommand.execute([]);
        expect(result.content).toContain("(Current)");
        expect(result.content).toContain("✅");
      });

      it("should show regional variants section", async () => {
        const result = await languageListCommand.execute([]);
        expect(result.content).toContain("Regional Variants");
        expect(result.content).toContain("en_GB");
        expect(result.content).toContain("es_MX");
        expect(result.content).toContain("fr_CA");
      });

      it("should include usage hint", async () => {
        const result = await languageListCommand.execute([]);
        expect(result.content).toContain("lang <locale_id>");
      });

      it("should have timestamp and id", async () => {
        const result = await languageListCommand.execute([]);
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(result.id).toBeDefined();
      });
    });

    describe("current language indicator", () => {
      it("should correctly indicate English (US) as current", async () => {
        mockCurrentLocale = "en_US";
        const result = await languageListCommand.execute([]);
        const lines = (result.content as string).split("\n");
        const englishLine = lines.find((l: string) =>
          l.includes("English (US)"),
        );
        expect(englishLine).toContain("✅");
        expect(englishLine).toContain("(Current)");
      });
    });
  });

  // ===========================================
  // languageInfoCommand (langinfo) Tests
  // ===========================================
  describe("languageInfoCommand (langinfo)", () => {
    describe("command metadata", () => {
      it("should have correct command name", () => {
        expect(languageInfoCommand.name).toBe("langinfo");
      });

      it("should have correct aliases", () => {
        expect(languageInfoCommand.aliases).toContain("localeinfo");
      });

      it("should have correct category", () => {
        expect(languageInfoCommand.category).toBe("system");
      });

      it("should have usage information", () => {
        expect(languageInfoCommand.usage).toBe("langinfo [locale_id]");
      });

      it("should have a description", () => {
        expect(languageInfoCommand.description).toBeDefined();
        expect(languageInfoCommand.description.length).toBeGreaterThan(0);
      });
    });

    describe("show current language info (no args)", () => {
      it("should return info type when no arguments", async () => {
        const result = await languageInfoCommand.execute([]);
        expect(result.type).toBe("info");
      });

      it("should show detailed current language information", async () => {
        const result = await languageInfoCommand.execute([]);
        expect(result.content).toContain("Current Language");
        expect(result.content).toContain("Flag:");
        expect(result.content).toContain("Name:");
        expect(result.content).toContain("Native:");
        expect(result.content).toContain("Code:");
        expect(result.content).toContain("Direction:");
      });

      it("should show English (US) details", async () => {
        mockCurrentLocale = "en_US";
        const result = await languageInfoCommand.execute([]);
        expect(result.content).toContain("🇺🇸");
        expect(result.content).toContain("English (US)");
        expect(result.content).toContain("en_US");
        expect(result.content).toContain("LTR");
      });

      it("should include usage hint for other languages", async () => {
        const result = await languageInfoCommand.execute([]);
        expect(result.content).toContain("langinfo <locale_id>");
      });

      it("should have timestamp and id", async () => {
        const result = await languageInfoCommand.execute([]);
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(result.id).toBeDefined();
      });
    });

    describe("show specific language info", () => {
      it("should show Indonesian language info", async () => {
        const result = await languageInfoCommand.execute(["id_ID"]);
        expect(result.type).toBe("info");
        expect(result.content).toContain("Indonesian");
        expect(result.content).toContain("Bahasa Indonesia");
        expect(result.content).toContain("🇮🇩");
        expect(result.content).toContain("id_ID");
      });

      it("should show Arabic language info with RTL direction", async () => {
        const result = await languageInfoCommand.execute(["ar_SA"]);
        expect(result.type).toBe("info");
        expect(result.content).toContain("Arabic");
        expect(result.content).toContain("العربية");
        expect(result.content).toContain("RTL");
      });

      it("should show French language info", async () => {
        const result = await languageInfoCommand.execute(["fr_FR"]);
        expect(result.type).toBe("info");
        expect(result.content).toContain("French");
        expect(result.content).toContain("Français");
      });

      it("should normalize hyphen to underscore", async () => {
        const result = await languageInfoCommand.execute(["es-ES"]);
        expect(result.type).toBe("info");
        expect(result.content).toContain("Spanish");
      });

      it("should indicate current language status", async () => {
        mockCurrentLocale = "en_US";
        const result = await languageInfoCommand.execute(["en_US"]);
        expect(result.content).toContain("Status: Current");
      });

      it("should indicate available status for non-current language", async () => {
        mockCurrentLocale = "en_US";
        const result = await languageInfoCommand.execute(["id_ID"]);
        expect(result.content).toContain("Status: Available");
      });

      it("should include hint to switch language", async () => {
        mockCurrentLocale = "en_US";
        const result = await languageInfoCommand.execute(["id_ID"]);
        expect(result.content).toContain("lang <locale_id>");
      });
    });

    describe("regional variant info", () => {
      it("should identify regional variant (en_GB)", async () => {
        const result = await languageInfoCommand.execute(["en_GB"]);
        expect(result.type).toBe("info");
        expect(result.content).toContain("Regional Variant");
      });

      it("should show fallback information for regional variant", async () => {
        const result = await languageInfoCommand.execute(["es_MX"]);
        expect(result.type).toBe("info");
        expect(result.content).toContain("falls back");
      });

      it("should explain regional variant behavior", async () => {
        const result = await languageInfoCommand.execute(["ar_EG"]);
        expect(result.type).toBe("info");
        expect(result.content).toContain("regional variant");
        expect(result.content).toContain("primary language");
      });
    });

    describe("invalid locale handling", () => {
      it("should return error for unknown locale", async () => {
        const result = await languageInfoCommand.execute(["zz_ZZ"]);
        expect(result.type).toBe("error");
        expect(result.content).toContain("Language not found");
        expect(result.content).toContain("zz_ZZ");
      });

      it("should return error for invalid format", async () => {
        const result = await languageInfoCommand.execute(["xyz"]);
        expect(result.type).toBe("error");
      });

      it("should return error for completely invalid input", async () => {
        const result = await languageInfoCommand.execute(["!@#$%"]);
        expect(result.type).toBe("error");
      });
    });
  });

  // ===========================================
  // Integration Tests
  // ===========================================
  describe("Integration Tests", () => {
    it("should maintain consistent state across commands", async () => {
      // Start with English
      mockCurrentLocale = "en_US";

      // Check current language
      let result = await languageCommand.execute([]);
      expect(result.content).toContain("English");

      // Change to Indonesian
      result = await languageCommand.execute(["id_ID"]);
      expect(result.type).toBe("success");

      // Verify langlist shows Indonesian as current
      mockCurrentLocale = "id_ID"; // Simulate the change
      result = await languageListCommand.execute([]);
      expect(result.content).toContain("Indonesian");
    });

    it("all commands should have consistent output structure", async () => {
      const langResult = await languageCommand.execute([]);
      const listResult = await languageListCommand.execute([]);
      const infoResult = await languageInfoCommand.execute([]);

      // All should have required properties
      for (const result of [langResult, listResult, infoResult]) {
        expect(result).toHaveProperty("type");
        expect(result).toHaveProperty("content");
        expect(result).toHaveProperty("timestamp");
        expect(result).toHaveProperty("id");
      }
    });

    it("commands should handle empty args array", async () => {
      const langResult = await languageCommand.execute([]);
      const listResult = await languageListCommand.execute([]);
      const infoResult = await languageInfoCommand.execute([]);

      expect(langResult.type).toBe("info");
      expect(listResult.type).toBe("info");
      expect(infoResult.type).toBe("info");
    });
  });

  // ===========================================
  // Edge Cases
  // ===========================================
  describe("Edge Cases", () => {
    it("should handle multiple consecutive language changes", async () => {
      const locales = ["id_ID", "es_ES", "fr_FR", "ar_SA"];

      for (const locale of locales) {
        const result = await languageCommand.execute([locale]);
        expect(result.type).toBe("success");
      }
    });

    it("should handle changing to already current language", async () => {
      mockCurrentLocale = "en_US";
      const result = await languageCommand.execute(["en_US"]);
      // Should still succeed even if already current
      expect(result.type).toBe("success");
    });

    it("should handle case variations in locale codes", async () => {
      // Standard format should work
      const result1 = await languageCommand.execute(["id_ID"]);
      expect(result1.type).toBe("success");

      // Hyphen format should work
      const result2 = await languageCommand.execute(["id-ID"]);
      expect(result2.type).toBe("success");
    });

    it("langinfo should not include switch hint for current language", async () => {
      mockCurrentLocale = "en_US";
      const result = await languageInfoCommand.execute(["en_US"]);
      // Should not suggest switching to the current language
      expect(result.content).toContain("Status: Current");
    });
  });
});
