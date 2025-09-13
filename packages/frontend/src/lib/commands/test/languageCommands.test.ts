import { describe, it, expect, vi } from "vitest";

vi.mock("@portfolio/frontend/src/lib/i18n/i18nService", () => ({
  i18n: {
    getCurrentLocale: () => "en_US",
    getCurrentLocaleConfig: () => ({
      code: "en_US",
      name: "English (US)",
      nativeName: "English",
      flag: "🇺🇸",
      direction: "ltr",
    }),
    getSupportedLocales: () => [
      { code: "en_US", name: "English (US)", flag: "🇺🇸" },
    ],
    setLocale: () => true,
  },
  t: (k: string) => k,
}));

vi.mock("@portfolio/frontend/src/lib/i18n/locales", () => ({
  isRegionalVariant: (code: string) => code.endsWith("_GB"),
  getFallbackLocale: () => "en_US",
  getLocaleConfig: (code: string) => {
    if (code === "zz_ZZ") return undefined;
    return {
      code,
      name: "English (US)",
      nativeName: "English",
      flag: "🇺🇸",
      direction: "ltr",
    };
  },
}));

import {
  languageCommand,
  languageListCommand,
  languageInfoCommand,
} from "../languageCommands";

describe("languageCommands", () => {
  it("show current language when no args", async () => {
    const out = await languageCommand.execute([] as any);
    expect(out.type).toBe("info");
  });

  it("change to regional variant uses fallback and returns success", async () => {
    const out = await languageCommand.execute(["en-GB"] as any);
    expect(out.type).toBe("success");
  });

  it("language list returns info", async () => {
    const out = await languageListCommand.execute([] as any);
    expect(out.type).toBe("info");
  });

  it("langinfo for unknown locale returns error", async () => {
    const out = await languageInfoCommand.execute(["zz_ZZ"] as any);
    expect(out.type).toBe("error");
  });
});
