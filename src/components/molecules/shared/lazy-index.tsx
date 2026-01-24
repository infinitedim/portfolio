"use client";

import { lazy } from "react";

export const LazyCustomizationManager = lazy(() =>
  import("@/components/organisms/customization/customization-manager").then((module) => ({
    default: module.CustomizationManager,
  })),
);

export const LazyThemeEditor = lazy(() =>
  import("@/components/molecules/customization/theme-editor").then((module) => ({
    default: module.ThemeEditor,
  })),
);

export const LazyFontManager = lazy(() =>
  import("@/components/molecules/customization/font-manager").then((module) => ({
    default: module.FontManager,
  })),
);

export const LazyRoadmapVisualizer = lazy(() =>
  import("@/components/organisms/roadmap/roadmap-visualizer").then((module) => ({
    default: module.RoadmapVisualizer,
  })),
);

export const LazyLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center gap-2 text-sm">
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      <span>Loading component...</span>
    </div>
  </div>
);
