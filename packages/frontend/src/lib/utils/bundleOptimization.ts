/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Bundle optimization utilities for better performance
 */

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload important fonts
  const fonts = ["/fonts/fira-code.woff2", "/fonts/cascadia-code.woff2"];

  fonts.forEach((font) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = font;
    link.as = "font";
    link.type = "font/woff2";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  });
};

// Prefetch resources that will likely be needed
export const prefetchResources = () => {
  // Prefetch theme-related resources
  const themes = ["dracula", "hacker", "cyberpunk"];

  themes.forEach((theme) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = `/themes/${theme}.json`;
    document.head.appendChild(link);
  });
};

// Optimize image loading
export const optimizeImageLoading = () => {
  // Add loading="lazy" to images not in viewport
  const images = document.querySelectorAll("img:not([loading])");
  images.forEach((img) => {
    if (img instanceof HTMLImageElement) {
      img.loading = "lazy";
    }
  });
};

// Dynamic import with retry logic
export const dynamicImportWithRetry = async <T>(
  importFn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error("Dynamic import failed after retries");
};

// Bundle analyzer helper (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV !== "development") return;

  // Log bundle sizes for major chunks
  const performanceEntries = performance.getEntriesByType("navigation");
  if (performanceEntries.length > 0) {
    const navEntry = performanceEntries[0] as PerformanceNavigationTiming;
    console.log("📊 Bundle Performance Metrics:", {
      loadTime: `${Math.round(navEntry.loadEventEnd - navEntry.fetchStart)}ms`,
      domContentLoaded: `${Math.round(navEntry.domContentLoadedEventEnd - navEntry.fetchStart)}ms`,
      firstPaint: "Check DevTools Performance tab",
    });
  }
};

// Tree shaking helper - mark unused exports
export const markUnusedExports = () => {
  if (process.env.NODE_ENV === "production") {
    // In production, these would be tree-shaken out
    console.warn(
      "Development mode - unused exports will be removed in production",
    );
  }
};

// Code splitting strategies
export const SplittingStrategies = {
  // Route-based splitting
  byRoute: () => ({
    home: () => import("@portfolio/frontend/src/app/page"),
    terminal: () =>
      import("@portfolio/frontend/src/components/terminal/Terminal"),
    customization: () =>
      import(
        "@portfolio/frontend/src/components/customization/CustomizationManager"
      ),
  }),

  // Feature-based splitting
  byFeature: () => ({
    themes: () => import("@portfolio/frontend/src/lib/themes/themeConfig"),
    commands: () =>
      import("@portfolio/frontend/src/lib/commands/commandRegistry"),
    roadmap: () =>
      import("@portfolio/frontend/src/lib/services/roadmapService"),
  }),

  // Size-based splitting (for large libraries)
  bySize: () => ({
    charts: () => import("recharts"),
    icons: () => import("lucide-react"),
    ui: () => import("@radix-ui/react-dialog"),
  }),
};

// Resource hints optimization
export const addResourceHints = () => {
  // DNS prefetch for external resources
  const dnsPrefetch = [
    "https://fonts.googleapis.com",
    "https://cdn.jsdelivr.net",
  ];

  dnsPrefetch.forEach((domain) => {
    const link = document.createElement("link");
    link.rel = "dns-prefetch";
    link.href = domain;
    document.head.appendChild(link);
  });

  // Preconnect to critical origins
  const preconnect = ["https://fonts.gstatic.com"];

  preconnect.forEach((origin) => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = origin;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  });
};

// Minimize third-party impact
export const optimizeThirdParty = () => {
  // Defer non-critical third-party scripts
  const analytics = "[src*='analytics']";
  const tracking = "[src*='tracking']";
  const scripts = document.querySelectorAll(
    `script${analytics}, script${tracking}`,
  );
  scripts.forEach((script) => {
    if (script instanceof HTMLScriptElement) {
      script.defer = true;
    }
  });
};

// Memory optimization
export const optimizeMemoryUsage = () => {
  // Clean up unused event listeners
  const cleanupListeners = () => {
    // Remove passive event listeners that are no longer needed
    const unusedEvents = ["resize", "scroll", "touchmove"];
    unusedEvents.forEach((event) => {
      const listeners = (window as any)._eventListeners?.[event];
      if (listeners && listeners.length > 10) {
        console.warn(`Many ${event} listeners detected. Consider cleanup.`);
      }
    });
  };

  // Cleanup interval
  setInterval(cleanupListeners, 30000);

  // Clear unused localStorage items
  const clearOldStorage = () => {
    const MS_IN_DAY = 24 * 60 * 60 * 1000;

    /**
     * @description Check if the data is a data with a timestamp
     * @param {unknown} data - The data to check
     * @returns {boolean} True if the data is a data with a timestamp, false otherwise
     */
    function isDataWithTimestamp(data: unknown): data is { timestamp: number } {
      return (
        typeof data === "object" &&
        data !== null &&
        "timestamp" in data &&
        typeof (data as any).timestamp === "number"
      );
    }

    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith("temp-") || key.startsWith("cache-")) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const data = JSON.parse(item);
            if (
              isDataWithTimestamp(data) &&
              Date.now() - data.timestamp > MS_IN_DAY
            ) {
              localStorage.removeItem(key);
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      }
    });
  };

  // Cleanup on page visibility change
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearOldStorage();
    }
  });
};

// Initialize optimizations
export const initBundleOptimizations = () => {
  // Run optimizations when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      preloadCriticalResources();
      addResourceHints();
      optimizeImageLoading();
      optimizeThirdParty();
      optimizeMemoryUsage();

      // Analyze bundle in development
      if (process.env.NODE_ENV === "development") {
        setTimeout(analyzeBundleSize, 2000);
      }
    });
  } else {
    // DOM already loaded
    preloadCriticalResources();
    addResourceHints();
    optimizeImageLoading();
    optimizeThirdParty();
    optimizeMemoryUsage();
  }

  // Prefetch resources after initial load
  setTimeout(prefetchResources, 3000);
};
