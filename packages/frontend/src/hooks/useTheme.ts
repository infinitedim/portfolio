"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type {
  ThemeConfig,
  ThemeName,
  ThemeColors,
} from "@portfolio/frontend/src/types/theme";
import {
  themes,
  defaultTheme,
  getSortedThemeNames,
  validateTheme,
} from "@portfolio/frontend/src/lib/themes/themeConfig";
import {
  safeDOMManipulation,
  useLocalStorage,
  useMountRef,
} from "./utils/hookUtils";

// Constants
const STORAGE_KEY = "terminal-theme" as const;
const REQUIRED_COLORS = ["bg", "text", "accent", "muted", "border"] as const;

// Types
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
}

// Utility functions (pure functions moved outside component)
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
  // Terminal variables
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

  // Shadcn variables
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
 * A custom React hook for managing the terminal's theme with improved performance and type safety.
 * @returns {UseThemeReturn} Theme state and management functions
 */
export function useTheme(): UseThemeReturn {
  const isMountedRef = useMountRef();
  const { getValue, setValue } = useLocalStorage(STORAGE_KEY, defaultTheme);

  // Cache for applied theme to prevent redundant DOM operations
  const appliedThemeRef = useRef<ThemeName | null>(null);

  // Initialize state with SSR-safe values
  const [state, setState] = useState<ThemeState>({
    theme: defaultTheme,
    error: null,
    mounted: false,
  });

  // Memoized values with proper dependencies
  const themeConfig = useMemo(() => {
    const config = themes[state.theme];
    return config && isValidThemeConfig(config) ? config : themes[defaultTheme];
  }, [state.theme]);

  const availableThemes = useMemo(() => getSortedThemeNames(), []);

  // Optimized theme application with proper safety checks and caching
  const applyTheme = useCallback(
    (config: ThemeConfig, themeName: ThemeName) => {
      if (!isMountedRef.current || !isValidThemeConfig(config)) {
        return;
      }

      // Skip if theme is already applied
      if (appliedThemeRef.current === themeName) {
        return;
      }

      safeDOMManipulation(() => {
        try {
          const root = document.documentElement;
          const body = document.body;

          if (!root || !body) {
            throw new Error("DOM elements not available");
          }

          // Update theme class efficiently
          const themeClasses = body.className
            .split(" ")
            .filter((cls) => !cls.startsWith("theme-"));
          themeClasses.push(`theme-${themeName}`);
          body.className = themeClasses.join(" ");

          // Apply CSS variables in batch
          const cssVars = generateCSSVariables(config.colors);
          Object.entries(cssVars).forEach(([property, value]) => {
            root.style.setProperty(property, value);
          });

          appliedThemeRef.current = themeName;
        } catch (error) {
          console.warn("Failed to apply theme:", error);
          if (isMountedRef.current) {
            setState((prev) => ({ ...prev, error: "Failed to apply theme" }));
          }
        }
      });
    },
    [isMountedRef], // Stable dependencies
  );

  // Theme change handler with improved validation and localStorage integration
  const changeTheme = useCallback(
    (newTheme: ThemeName): boolean => {
      if (!isMountedRef.current) return false;

      // Validate theme exists and has valid config
      if (
        !validateTheme(newTheme) ||
        !themes[newTheme] ||
        !isValidThemeConfig(themes[newTheme])
      ) {
        setState((prev) => ({ ...prev, error: `Invalid theme: ${newTheme}` }));
        return false;
      }

      if (state.theme === newTheme) return true;

      // Update state
      setState((prev) => ({ ...prev, theme: newTheme, error: null }));

      // Save to localStorage using utility
      if (!setValue(newTheme)) {
        console.warn("Failed to save theme to localStorage");
        // Don't set error state for localStorage failures as theme still works
      }

      return true;
    },
    [isMountedRef, state.theme, setValue], // Include setValue dependency
  );

  // Initialize theme and handle mounting
  useEffect(() => {
    try {
      // Set mounted state
      setState((prev) => ({ ...prev, mounted: true }));

      // Load saved theme from localStorage using utility
      const savedTheme = getValue();
      if (savedTheme && validateTheme(savedTheme) && themes[savedTheme]) {
        setState((prev) => ({ ...prev, theme: savedTheme as ThemeName }));
      }
    } catch (error) {
      console.warn("Error initializing theme:", error);
      // Set default theme if initialization fails
      setState((prev) => ({ ...prev, mounted: true, theme: defaultTheme }));
    }
  }, [getValue]); // Include getValue dependency

  // Apply theme changes when theme or mounted state changes
  useEffect(() => {
    try {
      if (state.mounted && isMountedRef.current) {
        applyTheme(themeConfig, state.theme);
      }
    } catch (error) {
      console.warn("Error applying theme:", error);
    }
  }, [state.mounted, state.theme, themeConfig, applyTheme, isMountedRef]);

  // Memoized utility functions to prevent unnecessary re-renders
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

  // Memoize return object to prevent unnecessary re-renders
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
    ],
  );
}
