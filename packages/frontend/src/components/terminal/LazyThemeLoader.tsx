/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { type ComponentType } from "react";

import { JSX, lazy, Suspense } from "react";
import type { ThemeName } from "@/types/theme";
import { TerminalLoadingProgress } from "@/components/ui/TerminalLoadingProgress";

const ThemeConfigs = lazy(() =>
  import("@/lib/themes/themeConfig").then((module) => ({
    default: module.themes as unknown as ComponentType<any>,
  })),
);

/**
 * Props for the LazyThemeLoader component
 * @interface LazyThemeLoaderProps
 * @property {ThemeName} themeName - Name of the theme to load
 * @property {(themeConfig: any) => React.ReactNode} children - Render prop receiving theme config
 */
interface LazyThemeLoaderProps {
  themeName: ThemeName;
  children: (themeConfig: any) => React.ReactNode;
}

/**
 * Lazy theme loader component with code splitting
 * Loads theme configurations dynamically with a loading fallback
 * @param {LazyThemeLoaderProps} props - Component props
 * @param {ThemeName} props.themeName - Name of theme to load
 * @param {(themeConfig: any) => React.ReactNode} props.children - Render prop function
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
  return (
    <Suspense
      fallback={
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
      }
    >
      <ThemeConfigs>
        {(themes: { [x: string]: any }) => children(themes[themeName])}
      </ThemeConfigs>
    </Suspense>
  );
}
