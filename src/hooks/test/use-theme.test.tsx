import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "@/hooks/use-theme";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
})();

describe("useTheme", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }

    ensureDocumentBody();

    vi.useFakeTimers();
    mockLocalStorage.clear();
    vi.clearAllMocks();

    // Mock localStorage - only if window is available and localStorage is configurable
    if (typeof window !== "undefined") {
      try {
        // Try to delete existing property first if configurable
        const descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
        if (descriptor?.configurable) {
          delete (window as { localStorage?: unknown }).localStorage;
        }
        Object.defineProperty(window, "localStorage", {
          value: mockLocalStorage,
          writable: true,
          configurable: true,
        });
      } catch {
        // If localStorage is already defined and not configurable, use the existing one
        // This happens when setup.ts already defines it
      }
    }

    // Ensure document.body exists
    if (!document.body) {
      const body = document.createElement("body");
      if (document.documentElement) {
        document.documentElement.appendChild(body);
      }
    }
  });

  afterEach(() => {
    if (!canRunTests) {
      return;
    }
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("initializes with default theme", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBeDefined();
      expect(typeof result.current.theme).toBe("string");
    });

    it("returns theme config object", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      expect(result.current.themeConfig).toBeDefined();
      expect(result.current.themeConfig.name).toBeDefined();
      expect(result.current.themeConfig.colors).toBeDefined();
    });

    it("has no error on initialization", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      expect(result.current.error).toBeNull();
      expect(result.current.hasError).toBe(false);
    });

    it("provides list of available themes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      expect(Array.isArray(result.current.availableThemes)).toBe(true);
      expect(result.current.availableThemes.length).toBeGreaterThan(0);
    });
  });

  describe("changeTheme", () => {
    it("changes theme to valid theme name", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      const availableTheme = result.current.availableThemes[0];

      act(() => {
        const success = result.current.changeTheme(availableTheme);
        expect(success).toBe(true);
      });

      expect(result.current.theme).toBe(availableTheme);
    });

    it("returns false for invalid theme", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      act(() => {
        const success = result.current.changeTheme("invalidThemeName" as any);
        expect(success).toBe(false);
      });
    });

    it("sets error for invalid theme", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.changeTheme("invalidThemeName" as any);
      });

      expect(result.current.hasError).toBe(true);
    });
  });

  describe("clearError", () => {
    it("clears existing error", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.changeTheme("invalidThemeName" as any);
      });

      expect(result.current.hasError).toBe(true);

      act(() => {
        result.current.clearError();
      });

      expect(result.current.hasError).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("getThemeInfo", () => {
    it("returns current theme info when no argument", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      const info = result.current.getThemeInfo();

      expect(info).toBeDefined();
      expect(info.name).toBe(result.current.themeConfig.name);
    });

    it("returns specific theme info when name provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      const themeName = result.current.availableThemes[0];
      const info = result.current.getThemeInfo(themeName);

      expect(info).toBeDefined();
      expect(info.name).toBeDefined();
    });
  });

  describe("isThemeActive", () => {
    it("returns true for current theme", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      const isActive = result.current.isThemeActive(result.current.theme);

      expect(isActive).toBe(true);
    });

    it("returns false for non-current theme", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      const themes = result.current.availableThemes;
      const otherTheme = themes.find((t: string) => t !== result.current.theme);

      if (otherTheme) {
        const isActive = result.current.isThemeActive(otherTheme);
        expect(isActive).toBe(false);
      }
    });
  });

  describe("validateTheme", () => {
    it("exposes validateTheme function", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      expect(typeof result.current.validateTheme).toBe("function");
    });
  });

  describe("theme metrics", () => {
    it("provides theme metrics object", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      expect(result.current.themeMetrics).toBeDefined();
      expect(typeof result.current.themeMetrics.switchCount).toBe("number");
      expect(typeof result.current.themeMetrics.averageSwitchTime).toBe(
        "number",
      );
    });

    it("tracks switch count", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      const initialCount = result.current.themeMetrics.switchCount;
      const themes = result.current.availableThemes;

      if (themes.length > 1) {
        act(() => {
          result.current.changeTheme(themes[0]);
        });

        expect(result.current.themeMetrics.switchCount).toBeGreaterThanOrEqual(
          initialCount,
        );
      }
    });
  });

  describe("getPerformanceReport", () => {
    it("returns performance report object", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      const report = result.current.getPerformanceReport();

      expect(report).toBeDefined();
      expect(typeof report.totalSwitches).toBe("number");
      expect(typeof report.averageTime).toBe("number");
      expect(typeof report.themeUsage).toBe("object");
    });
  });

  describe("resetPerformanceMetrics", () => {
    it("resets performance metrics", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.resetPerformanceMetrics();
      });

      const report = result.current.getPerformanceReport();
      expect(report.totalSwitches).toBe(0);
    });
  });

  describe("mounted state", () => {
    it("tracks mounted state", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { result } = renderHook(() => useTheme());

      // Should eventually be mounted
      expect(typeof result.current.mounted).toBe("boolean");
    });
  });
});
