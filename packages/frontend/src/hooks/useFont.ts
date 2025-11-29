"use client";

import { useState, useEffect, useRef } from "react";
import type { FontName } from "@/types/font";
import { fonts, defaultFont } from "@/lib/fonts/fontConfig";

// Constants
const STORAGE_KEY = "terminal-font" as const;

/**
 * A custom React hook for managing the terminal's font.
 *
 * This hook handles loading the selected font from `localStorage`, applying its
 * styles to the DOM via CSS custom properties, and persisting changes.
 * @returns {object} An object containing the current font state and management functions.
 * @property {FontName} font The name of the currently active font.
 * @property {import("@/types/theme").FontConfig} fontConfig The configuration object for the active font.
 * @property {(newFont: FontName) => void} changeFont A function to set a new font.
 * @property {FontName[]} availableFonts An array of all available font names.
 */
export function useFont() {
  const [font, setFont] = useState<FontName>(defaultFont);
  const [mounted, setMounted] = useState(false);
  const isMountedRef = useRef(false);

  // Handle mounting
  useEffect(() => {
    setMounted(true);
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load font from localStorage
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    try {
      const savedFont = localStorage.getItem(STORAGE_KEY) as FontName;
      if (savedFont && fonts[savedFont]) {
        setFont(savedFont);
      }
    } catch (error) {
      console.warn("Failed to load font from localStorage:", error);
    }
  }, [mounted]);

  // Apply font CSS custom properties
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, font);

      // Apply font CSS custom properties
      const root = document.documentElement;
      const fontConfig = fonts[font];

      if (!fontConfig) {
        console.warn(`Font configuration not found for: ${font}`);
        return;
      }

      root.style.setProperty("--terminal-font-family", fontConfig.family);
      root.style.setProperty("--terminal-font-weight", fontConfig.weight);

      // Enable/disable font ligatures
      root.style.setProperty(
        "--terminal-font-ligatures",
        fontConfig.ligatures ? "normal" : "none",
      );

      // Apply font class to body
      document.body.className = document.body.className.replace(
        /font-\w+/g,
        "",
      );
      document.body.classList.add(`font-${font}`);
    } catch (error) {
      console.error("Failed to apply font:", error);
    }
  }, [font, mounted]);

  const changeFont = (newFont: FontName) => {
    if (!isMountedRef.current) return;

    if (!fonts[newFont]) {
      console.warn(`Font ${newFont} not found`);
      return;
    }

    setFont(newFont);
  };

  return {
    font,
    fontConfig: fonts[font],
    changeFont,
    availableFonts: Object.keys(fonts) as FontName[],
    mounted,
  };
}
