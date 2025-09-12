"use client";

import { lazy, Suspense, type ComponentType, type JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";

// Lazy load heavy components for better performance
export const LazyCustomizationManager = lazy(() =>
  import("../customization/CustomizationManager").then((module) => ({
    default: module.CustomizationManager,
  })),
);

export const LazyFontManager = lazy(() =>
  import("../customization/FontManager").then((module) => ({
    default: module.FontManager,
  })),
);

export const LazyThemeManager = lazy(() =>
  import("../customization/ThemeManager").then((module) => ({
    default: module.ThemeManager,
  })),
);

export const LazyRoadmapVisualizer = lazy(() =>
  import("../roadmap/RoadmapVisualizer").then((module) => ({
    default: module.RoadmapVisualizer,
  })),
);

export const LazyCommandSuggestionsDemo = lazy(() =>
  import("../terminal/CommandSuggestionsDemo").then((module) => ({
    default: module.CommandSuggestionsDemo,
  })),
);

export const LazyTerminalLoadingDemo = lazy(() =>
  import("../ui/TerminalLoadingDemo").then((module) => ({
    default: module.TerminalLoadingDemo,
  })),
);

export const LazyHistorySearchPanel = lazy(() =>
  import("../terminal/HistorySearchPanel").then((module) => ({
    default: module.HistorySearchPanel,
  })),
);

// Loading fallback component
interface LoadingFallbackProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Loading fallback component
 * @param {LoadingFallbackProps} props - The props for the LoadingFallback component
 * @param {string} [props.text] - The text to display
 * @param {string} [props.size] - The size of the loading spinner
 * @returns {JSX.Element} The LoadingFallback component
 */
function LoadingFallback({
  text = "Loading...",
  size = "md",
}: LoadingFallbackProps): JSX.Element {
  const { themeConfig } = useTheme();

  const sizeClasses = {
    sm: "w-4 h-4 text-xs",
    md: "w-6 h-6 text-sm",
    lg: "w-8 h-8 text-base",
  };

  // Fallback colors if theme isn't loaded
  const fallbackColors = {
    bg: "#000000",
    text: "#ffffff",
    accent: "#00ff00",
  };

  const colors = themeConfig?.colors || fallbackColors;

  return (
    <div
      className="flex items-center justify-center p-4 space-x-2"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      <div
        className={`${sizeClasses[size].split(" ")[0]} ${sizeClasses[size].split(" ")[1]} border-2 border-transparent border-t-current animate-spin rounded-full`}
        style={{ borderTopColor: colors.accent }}
      />
      <span
        className={`font-mono ${sizeClasses[size].split(" ")[2]} animate-pulse`}
        style={{ color: colors.text }}
      >
        {text}
      </span>
    </div>
  );
}

// Higher-order component for lazy loading with custom fallback
/**
 *
 * @param {ComponentType<P>} LazyComponent - The component to load
 * @param {string} [loadingText] - The text to display
 * @param {string} [loadingSize] - The size of the loading spinner
 * @returns {ComponentType<P>} The wrapped lazy component
 */
export function withLazyLoading<P extends object>(
  LazyComponent: ComponentType<P>,
  loadingText?: string,
  loadingSize?: "sm" | "md" | "lg",
) {
  return function WrappedLazyComponent(props: P): JSX.Element {
    return (
      <Suspense
        fallback={
          <LoadingFallback
            text={loadingText}
            size={loadingSize}
          />
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Pre-configured lazy components with loading states
export const CustomizationManager = withLazyLoading(
  LazyCustomizationManager,
  "Loading customization panel...",
  "md",
);

export const FontManager = withLazyLoading(
  LazyFontManager,
  "Loading font manager...",
  "sm",
);

export const ThemeManager = withLazyLoading(
  LazyThemeManager,
  "Loading theme manager...",
  "sm",
);

export const RoadmapVisualizer = withLazyLoading(
  LazyRoadmapVisualizer,
  "Loading roadmap...",
  "md",
);

export const CommandSuggestionsDemo = withLazyLoading(
  LazyCommandSuggestionsDemo,
  "Loading demo...",
  "sm",
);

export const TerminalLoadingDemo = withLazyLoading(
  LazyTerminalLoadingDemo,
  "Loading demo...",
  "sm",
);

export const HistorySearchPanel = withLazyLoading(
  LazyHistorySearchPanel,
  "Loading history...",
  "md",
);
