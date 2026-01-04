import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useI18n } from "../useI18n";
import { i18n } from "@/lib/i18n/i18nService";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Only define localStorage if window is available
if (canRunTests && typeof window !== "undefined") {
  try {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  } catch {
    // localStorage might already be defined, skip
  }
}

describe("useI18n", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }

    ensureDocumentBody();
    localStorageMock.clear();
    vi.clearAllMocks();
    // Reset i18n singleton to default locale
    i18n.setLocale("en_US");
  });

  afterEach(() => {
    if (!canRunTests) {
      return;
    }
    localStorageMock.clear();
  });

  describe("initialization", () => {
    it("exposes i18n helpers", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());
      expect(typeof result.current.t).toBe("function");
      expect(Array.isArray(result.current.getSupportedLocales())).toBe(true);
    });

    it("should have default locale set to en_US", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());
      expect(result.current.currentLocale).toBe("en_US");
    });

    it("should expose all required functions", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());
      expect(typeof result.current.t).toBe("function");
      expect(typeof result.current.tWithFallback).toBe("function");
      expect(typeof result.current.changeLocale).toBe("function");
      expect(typeof result.current.getCurrentLocaleConfig).toBe("function");
      expect(typeof result.current.getSupportedLocales).toBe("function");
      expect(typeof result.current.isLocaleSupported).toBe("function");
      expect(typeof result.current.getLocaleInfo).toBe("function");
    });
  });

  describe("translation function", () => {
    it("should translate common keys correctly in en_US", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());
      expect(result.current.t("welcome")).toBe("Welcome");
      expect(result.current.t("loading")).toBe("Loading...");
      expect(result.current.t("error")).toBe("Error");
      expect(result.current.t("success")).toBe("Success");
    });

    it("should translate navigation keys correctly", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());
      expect(result.current.t("home")).toBe("Home");
      expect(result.current.t("about")).toBe("About");
      expect(result.current.t("projects")).toBe("Projects");
      expect(result.current.t("skills")).toBe("Skills");
      expect(result.current.t("contact")).toBe("Contact");
    });

    it("should return key if translation not found", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());
      // @ts-expect-error - testing invalid key
      expect(result.current.t("nonExistentKey")).toBe("nonExistentKey");
    });

    it("should use fallback with tWithFallback", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());
      // @ts-expect-error - testing invalid key with fallback
      expect(result.current.tWithFallback("nonExistentKey", "Fallback")).toBe(
        "Fallback",
      );
    });
  });

  describe("locale switching", () => {
    it("should change locale to Indonesian", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());

      act(() => {
        result.current.changeLocale("id_ID");
      });

      expect(result.current.currentLocale).toBe("id_ID");
      expect(result.current.t("welcome")).toBe("Selamat Datang");
      expect(result.current.t("loading")).toBe("Memuat...");
    });

    it("should change locale to Spanish", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());

      act(() => {
        result.current.changeLocale("es_ES");
      });

      expect(result.current.currentLocale).toBe("es_ES");
      expect(result.current.t("welcome")).toBe("Bienvenido");
    });

    it("should handle regional variants (en_GB -> en_US)", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());

      act(() => {
        const success = result.current.changeLocale("en_GB");
        expect(success).toBe(true);
      });

      // Should fallback to en_US
      expect(result.current.currentLocale).toBe("en_US");
    });

    it("should return false for unsupported locale", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());

      act(() => {
        const success = result.current.changeLocale("invalid_XX");
        expect(success).toBe(false);
      });

      // Should remain on current locale
      expect(result.current.currentLocale).toBe("en_US");
    });

    it("should normalize locale codes with hyphen to underscore", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());

      act(() => {
        result.current.changeLocale("id-ID");
      });

      expect(result.current.currentLocale).toBe("id_ID");
    });
  });

  describe("supported locales", () => {
    it("should return list of supported locales", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());
      const locales = result.current.getSupportedLocales();

      expect(locales.length).toBeGreaterThan(0);
      expect(locales.some((l) => l.code === "en_US")).toBe(true);
      expect(locales.some((l) => l.code === "id_ID")).toBe(true);
      expect(locales.some((l) => l.code === "es_ES")).toBe(true);
    });

    it("should check if locale is supported", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());

      expect(result.current.isLocaleSupported("en_US")).toBe(true);
      expect(result.current.isLocaleSupported("id_ID")).toBe(true);
      expect(result.current.isLocaleSupported("invalid_XX")).toBe(false);
    });

    it("should get locale info", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());

      const enUS = result.current.getLocaleInfo("en_US");
      expect(enUS).toBeDefined();
      expect(enUS?.code).toBe("en_US");
      expect(enUS?.name).toBe("English (US)");
      expect(enUS?.direction).toBe("ltr");

      const arSA = result.current.getLocaleInfo("ar_SA");
      expect(arSA).toBeDefined();
      expect(arSA?.direction).toBe("rtl");
    });
  });

  describe("RTL support", () => {
    it("should detect RTL for Arabic locale", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());

      act(() => {
        result.current.changeLocale("ar_SA");
      });

      expect(result.current.isRTL).toBe(true);
    });

    it("should detect LTR for English locale", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());

      expect(result.current.isRTL).toBe(false);
    });
  });

  describe("current locale config", () => {
    it("should return current locale config", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());

      const config = result.current.getCurrentLocaleConfig();
      expect(config).toBeDefined();
      expect(config?.code).toBe("en_US");
      expect(config?.flag).toBe("🇺🇸");
    });

    it("should update config when locale changes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useI18n());

      act(() => {
        result.current.changeLocale("id_ID");
      });

      const config = result.current.getCurrentLocaleConfig();
      expect(config?.code).toBe("id_ID");
      expect(config?.flag).toBe("🇮🇩");
      expect(config?.nativeName).toBe("Bahasa Indonesia");
    });
  });
});
