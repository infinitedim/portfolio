"use client";

import { lazy } from "react";

// Lazy load heavy components that are not immediately needed
export const LazyCustomizationManager = lazy(() =>
  import("../customization/CustomizationManager").then((module) => ({
    default: module.CustomizationManager,
  })),
);

export const LazyThemeEditor = lazy(() =>
  import("../customization/ThemeEditor").then((module) => ({
    default: module.ThemeEditor,
  })),
);

export const LazyFontManager = lazy(() =>
  import("../customization/FontManager").then((module) => ({
    default: module.FontManager,
  })),
);

export const LazyRoadmapVisualizer = lazy(() =>
  import("../roadmap/RoadmapVisualizer").then((module) => ({
    default: module.RoadmapVisualizer,
  })),
);

// Loading fallback component
export const LazyLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center gap-2 text-sm">
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      <span>Loading component...</span>
    </div>
  </div>
);
