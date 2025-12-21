"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { ThemeConfig, ThemeName, ThemeColors } from "../types/theme";
import {
  themes,
  defaultTheme,
  getSortedThemeNames,
  validateTheme,
} from "../lib/themes/themeConfig";
import {
  safeDOMManipulation,
  useLocalStorage,
  useMountRef,
} from "./utils/hooks-utils";
import { PerformanceMonitor } from "../lib/performance/PerformanceMonitor";

const STORAGE_KEY = "terminal-theme" as const;
const REQUIRED_COLORS = ["bg", "text", "accent", "muted", "border"] as const;

interface ThemeState {
  theme: ThemeName;
  error: string | null;
  mounted: boolean;
}

interface UseThemeReturn {
  theme: ThemeName;
  themeConfig: ThemeConfig;
  error: string | null;
  hasError: boolean;
  mounted: boolean;
  changeTheme: (newTheme: ThemeName) => boolean;
  clearError: () => void;
  availableThemes: ThemeName[];
  getThemeInfo: (themeName?: ThemeName) => ThemeConfig;
  isThemeActive: (themeName: ThemeName) => boolean;
  validateTheme: typeof validateTheme;
  themeMetrics: {
    switchCount: number;
    averageSwitchTime: number;
    lastSwitchTime: number;
    popularThemes: { theme: ThemeName; count: number }[];
    renderTime: number;
  };
  getPerformanceReport: () => {
    totalSwitches: number;
    averageTime: number;
    fastestSwitch: number;
    slowestSwitch: number;
    themeUsage: Record<ThemeName, number>;
  };
  resetPerformanceMetrics: () => void;
}

const hexToHsl = (hex: string): string => {
  if (!hex?.match(/^#[0-9A-Fa-f]{6}$/)) return "0 0% 0%";

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h =
      max === r
        ? (g - b) / d + (g < b ? 6 : 0)
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const isValidThemeConfig = (config: ThemeConfig): boolean => {
  if (!config?.colors) return false;
  return REQUIRED_COLORS.every(
    (color) =>
      typeof config.colors[color] === "string" &&
      config.colors[color].startsWith("#"),
  );
};

const generateCSSVariables = (colors: ThemeColors) => ({
  "--terminal-bg": colors.bg,
  "--terminal-text": colors.text,
  "--terminal-accent": colors.accent,
  "--terminal-muted": colors.muted,
  "--terminal-border": colors.border,
  "--terminal-success": colors.success || colors.accent,
  "--terminal-error": colors.error || "#ff4444",
  "--terminal-warning": colors.warning || "#ffaa00",
  "--terminal-info": colors.info || "#00aaff",
  "--terminal-prompt": colors.prompt || colors.accent,

  "--background": hexToHsl(colors.bg),
  "--foreground": hexToHsl(colors.text),
  "--primary": hexToHsl(colors.accent),
  "--primary-foreground": hexToHsl(colors.bg),
  "--muted": hexToHsl(colors.muted),
  "--muted-foreground": hexToHsl(colors.text),
  "--border": hexToHsl(colors.border),
  "--input": hexToHsl(colors.border),
  "--ring": hexToHsl(colors.accent),
  "--secondary": hexToHsl(colors.muted),
  "--secondary-foreground": hexToHsl(colors.text),
  "--accent": hexToHsl(colors.accent),
  "--accent-foreground": hexToHsl(colors.bg),
  "--destructive": hexToHsl(colors.error || "#ef4444"),
  "--destructive-foreground": hexToHsl(colors.bg),
  "--card": hexToHsl(colors.bg),
  "--card-foreground": hexToHsl(colors.text),
  "--popover": hexToHsl(colors.bg),
  "--popover-foreground": hexToHsl(colors.text),
});

/**
 * Advanced theme management hook with performance monitoring and validation
 *
 * Provides comprehensive theme functionality:
 * - Theme switching with CSS variable application
 * - localStorage persistence
 * - Performance tracking and metrics
 * - Theme validation and error handling
 * - HSL color conversion for shadcn/ui compatibility
 * - Usage analytics and popular themes tracking
 * - Safe DOM manipulation with SSR support
 *
 * @returns {UseThemeReturn} Theme state and management functions
 * @property {ThemeName} theme - Current active theme name
 * @property {ThemeConfig} themeConfig - Current theme configuration object
 * @property {string | null} error - Current error message or null
 * @property {boolean} hasError - Whether an error exists
 * @property {boolean} mounted - Whether the hook is mounted (SSR safety)
 * @property {Function} changeTheme - Switch to a different theme
 * @property {Function} clearError - Clear the current error
 * @property {ThemeName[]} availableThemes - Array of all available theme names
 * @property {Function} getThemeInfo - Get configuration for any theme
 * @property {Function} isThemeActive - Check if a theme is currently active
 * @property {Function} validateTheme - Validate a theme name
 * @property {object} themeMetrics - Performance metrics for theme operations
 * @property {Function} getPerformanceReport - Get detailed performance report
 * @property {Function} resetPerformanceMetrics - Reset all performance metrics
 *
 * @example
 * ```tsx
 * const {
 *   theme,
 *   themeConfig,
 *   changeTheme,
 *   availableThemes,
 *   themeMetrics,
 *   getPerformanceReport
 * } = useTheme();
 *
 * // Change theme
 * const success = changeTheme('dracula');
 *
 * // Get available themes
 * console.log('Available themes:', availableThemes);
 *
 * // Check performance
 * const report = getPerformanceReport();
 * console.log(`Average switch time: ${report.averageTime}ms`);
 *
 * // Get theme info
 * const draculaConfig = getThemeInfo('dracula');
 * ```
 */
export function useTheme(): UseThemeReturn {
  const isMountedRef = useMountRef();
  const { getValue, setValue } = useLocalStorage(STORAGE_KEY, defaultTheme);

  const appliedThemeRef = useRef<ThemeName | null>(null);

  const performanceMonitor = useMemo(
    () => PerformanceMonitor.getInstance(),
    [],
  );
  const switchTimesRef = useRef<number[]>([]);
  const themeUsageRef = useRef<Map<ThemeName, number>>(new Map());
  const [themeMetrics, setThemeMetrics] = useState({
    switchCount: 0,
    averageSwitchTime: 0,
    lastSwitchTime: 0,
    popularThemes: [] as { theme: ThemeName; count: number }[],
    renderTime: 0,
  });

  const [state, setState] = useState<ThemeState>({
    theme: defaultTheme,
    error: null,
    mounted: false,
  });

  const themeConfig = useMemo(() => {
    const config = themes[state.theme];
    return config && isValidThemeConfig(config) ? config : themes[defaultTheme];
  }, [state.theme]);

  const availableThemes = useMemo(() => getSortedThemeNames(), []);

  const applyTheme = useCallback(
    (config: ThemeConfig, themeName: ThemeName) => {
      if (!isMountedRef.current || !isValidThemeConfig(config)) {
        return;
      }

      if (appliedThemeRef.current === themeName) {
        return;
      }

      const startTime = performance.now();
      performanceMonitor.startTiming("theme-application", "theme");

      safeDOMManipulation(() => {
        try {
          const root = document.documentElement;
          const body = document.body;

          if (!root || !body) {
            throw new Error("DOM elements not available");
          }

          const themeClasses = body.className
            .split(" ")
            .filter((cls) => !cls.startsWith("theme-"));
          themeClasses.push(`theme-${themeName}`);
          body.className = themeClasses.join(" ");

          const cssVars = generateCSSVariables(config.colors);
          const cssText = Object.entries(cssVars)
            .map(([property, value]) => `${property}: ${value}`)
            .join("; ");
          root.style.cssText += `; ${cssText}`;

          appliedThemeRef.current = themeName;

          const renderTime = performanceMonitor.endTiming(
            "theme-application",
            "theme",
            { theme: themeName },
          );

          setThemeMetrics((prev) => ({
            ...prev,
            renderTime,
            lastSwitchTime: renderTime,
          }));
        } catch (error) {
          console.warn("Failed to apply theme:", error);
          performanceMonitor.recordMetric(
            "theme-application-error",
            performance.now() - startTime,
            "theme",
            { error: String(error), theme: themeName },
          );
          if (isMountedRef.current) {
            setState((prev) => ({ ...prev, error: "Failed to apply theme" }));
          }
        }
      });
    },
    [isMountedRef, performanceMonitor],
  );

  const changeTheme = useCallback(
    (newTheme: ThemeName): boolean => {
      if (!isMountedRef.current) return false;

      if (
        !validateTheme(newTheme) ||
        !themes[newTheme] ||
        !isValidThemeConfig(themes[newTheme])
      ) {
        setState((prev) => ({ ...prev, error: `Invalid theme: ${newTheme}` }));
        return false;
      }

      if (state.theme === newTheme) return true;

      performanceMonitor.startTiming("theme-switch", "theme");

      const currentCount = themeUsageRef.current.get(newTheme) || 0;
      themeUsageRef.current.set(newTheme, currentCount + 1);

      setState((prev) => ({ ...prev, theme: newTheme, error: null }));

      if (!setValue(newTheme)) {
        console.warn("Failed to save theme to localStorage");
      }

      const switchTime = performanceMonitor.endTiming("theme-switch", "theme", {
        fromTheme: state.theme,
        toTheme: newTheme,
      });

      switchTimesRef.current.push(switchTime);
      if (switchTimesRef.current.length > 100) {
        switchTimesRef.current = switchTimesRef.current.slice(-100);
      }

      const averageTime =
        switchTimesRef.current.reduce((sum, time) => sum + time, 0) /
        switchTimesRef.current.length;

      const themeEntries = Array.from(themeUsageRef.current.entries()).map(
        ([theme, count]) => ({ theme, count }),
      );
      themeEntries.sort((a, b) => b.count - a.count);

      setThemeMetrics((prev) => ({
        ...prev,
        switchCount: prev.switchCount + 1,
        averageSwitchTime: averageTime,
        lastSwitchTime: switchTime,
        popularThemes: themeEntries.slice(0, 5),
      }));

      return true;
    },
    [
      isMountedRef,
      state.theme,
      setValue,
      performanceMonitor,
      themeUsageRef,
      switchTimesRef,
      setThemeMetrics,
    ],
  );

  useEffect(() => {
    try {
      setState((prev) => ({ ...prev, mounted: true }));

      const savedTheme = getValue();
      if (savedTheme && validateTheme(savedTheme) && themes[savedTheme]) {
        setState((prev) => ({ ...prev, theme: savedTheme as ThemeName }));
      }
    } catch (error) {
      console.warn("Error initializing theme:", error);
      setState((prev) => ({ ...prev, mounted: true, theme: defaultTheme }));
    }
  }, [getValue]);

  useEffect(() => {
    try {
      if (state.mounted && isMountedRef.current) {
        applyTheme(themeConfig, state.theme);
      }
    } catch (error) {
      console.warn("Error applying theme:", error);
    }
  }, [state.mounted, state.theme, themeConfig, applyTheme, isMountedRef]);

  const getThemeInfo = useCallback(
    (themeName?: ThemeName): ThemeConfig => {
      const targetTheme = themeName || state.theme;
      const config = themes[targetTheme];
      return config && isValidThemeConfig(config)
        ? config
        : themes[defaultTheme];
    },
    [state.theme],
  );

  const isThemeActive = useCallback(
    (themeName: ThemeName): boolean => state.theme === themeName,
    [state.theme],
  );

  const clearError = useCallback(() => {
    if (isMountedRef.current) {
      setState((prev) => ({ ...prev, error: null }));
    }
  }, [isMountedRef]);

  const getPerformanceReport = useCallback(() => {
    const times = switchTimesRef.current;
    const usage = Array.from(themeUsageRef.current.entries()).reduce(
      (acc, [theme, count]) => {
        acc[theme] = count;
        return acc;
      },
      {} as Record<ThemeName, number>,
    );

    return {
      totalSwitches: times.length,
      averageTime:
        times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      fastestSwitch: times.length > 0 ? Math.min(...times) : 0,
      slowestSwitch: times.length > 0 ? Math.max(...times) : 0,
      themeUsage: usage,
    };
  }, []);

  const resetPerformanceMetrics = useCallback(() => {
    switchTimesRef.current = [];
    themeUsageRef.current.clear();
    setThemeMetrics({
      switchCount: 0,
      averageSwitchTime: 0,
      lastSwitchTime: 0,
      popularThemes: [],
      renderTime: 0,
    });
  }, []);

  return useMemo(
    () => ({
      theme: state.theme,
      themeConfig,
      error: state.error,
      hasError: !!state.error,
      mounted: state.mounted,
      changeTheme,
      clearError,
      availableThemes,
      getThemeInfo,
      isThemeActive,
      validateTheme,
      themeMetrics,
      getPerformanceReport,
      resetPerformanceMetrics,
    }),
    [
      state.theme,
      state.error,
      state.mounted,
      themeConfig,
      changeTheme,
      clearError,
      availableThemes,
      getThemeInfo,
      isThemeActive,
      themeMetrics,
      getPerformanceReport,
      resetPerformanceMetrics,
    ],
  );
}
