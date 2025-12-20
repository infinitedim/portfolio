"use client";

import React, { JSX, useState, useEffect } from "react";
import type { ThemeName, ThemeConfig } from "@/types/theme";
import { TerminalLoadingProgress } from "@/components/ui/TerminalLoadingProgress";

/**
 * Props for the LazyThemeLoader component
 * @interface LazyThemeLoaderProps
 * @property {ThemeName} themeName - Name of the theme to load
 * @property {(themeConfig: ThemeConfig) => React.ReactNode} children - Render prop receiving theme config
 */
interface LazyThemeLoaderProps {
  themeName: ThemeName;
  children: (themeConfig: ThemeConfig) => React.ReactNode;
}

/**
 * Lazy theme loader component with code splitting
 * Loads theme configurations dynamically with a loading fallback
 * @param {LazyThemeLoaderProps} props - Component props
 * @param {ThemeName} props.themeName - Name of theme to load
 * @param {(themeConfig: ThemeConfig) => React.ReactNode} props.children - Render prop function
 * @returns {JSX.Element} Suspense wrapper with lazy-loaded theme
 * @example
 * ```tsx
 * <LazyThemeLoader themeName="cyberpunk">
 *   {(config) => <Terminal themeConfig={config} />}
 * </LazyThemeLoader>
 * ```
 */
export function LazyThemeLoader({
  themeName,
  children,
}: LazyThemeLoaderProps): JSX.Element {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    import("@/lib/themes/themeConfig")
      .then((module) => {
        if (!cancelled) {
          setThemeConfig(module.themes[themeName]);
          setIsLoading(false);
        }
        return;
      })
      .catch((error) => {
        console.error("Failed to load theme config:", error);
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [themeName]);

  if (isLoading || !themeConfig) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "#000000",
          color: "#ffffff",
        }}
      >
        <div className="w-full max-w-md p-6">
          <TerminalLoadingProgress
            duration={2000}
            completionText="🎨 Theme loaded successfully!"
            autoStart={true}
          />
        </div>
      </div>
    );
  }

  return <>{children(themeConfig)}</>;
}
