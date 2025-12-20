"use client";

import {useState, useEffect, useRef, useCallback, useMemo} from "react";
import type {FontName} from "@/types/font";
import {fonts, defaultFont} from "@/lib/fonts/fontConfig";

const STORAGE_KEY = "terminal-font" as const;

/**
 * A custom React hook for managing the terminal's font.
 *
 * Optimized for performance with:
 * - Lazy initialization from localStorage
 * - Memoized available fonts array
 * - Stable callback references
 * - Batched DOM updates
 * - SSR-safe operations
 *
 * @returns {object} An object containing the current font state and management functions.
 * @property {FontName} font - The name of the currently active font.
 * @property {import("@/types/theme").FontConfig} fontConfig - The configuration object for the active font.
 * @property {(newFont: FontName) => void} changeFont - A function to set a new font.
 * @property {FontName[]} availableFonts - An array of all available font names.
 * @property {boolean} mounted - Whether the component is mounted (SSR safety).
 *
 * @example
 * ```tsx
 * const { font, fontConfig, changeFont, availableFonts } = useFont();
 *
 * // Change font
 * changeFont('fira-code');
 *
 * // Get current font family
 * console.log(fontConfig.family);
 * ```
 */
export function useFont() {
  const [font, setFont] = useState<FontName>(() => {
    if (typeof window === "undefined") return defaultFont;
    try {
      const savedFont = localStorage.getItem(STORAGE_KEY) as FontName;
      return savedFont && fonts[savedFont] ? savedFont : defaultFont;
    } catch {
      return defaultFont;
    }
  });

  const [mounted, setMounted] = useState(false);
  const isMountedRef = useRef(false);
  const appliedFontRef = useRef<FontName | null>(null);

  const availableFonts = useMemo(() => Object.keys(fonts) as FontName[], []);

  const fontConfig = useMemo(() => fonts[font] || fonts[defaultFont], [font]);

  useEffect(() => {
    setMounted(true);
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    if (appliedFontRef.current === font) return;

    try {
      localStorage.setItem(STORAGE_KEY, font);

      const currentFontConfig = fonts[font];
      if (!currentFontConfig) {
        console.warn(`Font configuration not found for: ${font}`);
        return;
      }

      const root = document.documentElement;
      root.style.setProperty(
        "--terminal-font-family",
        currentFontConfig.family,
      );
      root.style.setProperty(
        "--terminal-font-weight",
        currentFontConfig.weight,
      );
      root.style.setProperty(
        "--terminal-font-ligatures",
        currentFontConfig.ligatures ? "normal" : "none",
      );

      const body = document.body;
      const newClassName =
        body.className.replace(/font-\w+/g, "").trim() + ` font-${font}`;
      body.className = newClassName.trim();

      appliedFontRef.current = font;
    } catch (error) {
      console.error("Failed to apply font:", error);
    }
  }, [font, mounted]);

  const changeFont = useCallback((newFont: FontName) => {
    if (!isMountedRef.current) return;

    if (!fonts[newFont]) {
      console.warn(`Font ${newFont} not found`);
      return;
    }

    setFont(newFont);
  }, []);

  return {
    font,
    fontConfig,
    changeFont,
    availableFonts,
    mounted,
  };
}
