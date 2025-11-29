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

interface LazyThemeLoaderProps {
  themeName: ThemeName;
  children: (themeConfig: any) => React.ReactNode;
}

/**
 * Lazily loads a theme configuration and provides it to its children.
 * @param {LazyThemeLoaderProps} props - The properties for the LazyThemeLoader component.
 * @param {ThemeName} props.themeName - The name of the theme to load.
 * @param {(themeConfig: any) => React.ReactNode} props.children - A render-prop function that receives the loaded theme configuration.
 * @returns {JSX.Element} - A Suspense component with the lazily loaded theme.
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
