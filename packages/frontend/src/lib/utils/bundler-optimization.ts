/**
 * Bundle optimization utilities for better performance
 */

/**
 * Preloads critical font resources to improve page load performance
 * Adds link elements with rel="preload" for specified fonts
 * @example
 * ```ts
 * preloadCriticalResources();
 * // Preloads Fira Code and Cascadia Code fonts
 * ```
 */
export const preloadCriticalResources = () => {
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

/**
 * Prefetches theme resources for faster loading when themes are switched
 * Uses rel="prefetch" to hint the browser to load resources during idle time
 * @example
 * ```ts
 * prefetchResources();
 * // Prefetches dracula, hacker, and cyberpunk theme JSON files
 * ```
 */
export const prefetchResources = () => {
  const themes = ["dracula", "hacker", "cyberpunk"];

  themes.forEach((theme) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = `/themes/${theme}.json`;
    document.head.appendChild(link);
  });
};

/**
 * Optimizes image loading by adding lazy loading to all images that don't have it
 * Improves initial page load by deferring off-screen images
 * @example
 * ```ts
 * optimizeImageLoading();
 * // All images without loading attribute get loading="lazy"
 * ```
 */
/**
 * Dynamically imports a module with automatic retry logic
 * Useful for handling transient network failures during code splitting
 * @param importFn - Function that returns a promise from dynamic import
 * @param retries - Number of retry attempts (default: 3)
 * @param delay - Base delay in milliseconds between retries (default: 1000)
 * @returns Promise that resolves to the imported module
 * @throws Error if all retry attempts fail
 * @example
 * ```ts
 * const module = await dynamicImportWithRetry(
 *   () => import('./MyComponent'),
 *   3,
 *   1000
 * );
 * ```
 */
export const optimizeImageLoading = () => {
  const images = document.querySelectorAll("img:not([loading])");
  images.forEach((img) => {
    if (img instanceof HTMLImageElement) {
      img.loading = "lazy";
    }
  });
};
/**
 * Analyzes and logs bundle performance metrics in development mode
 * Reports load time, DOM content loaded time, and first paint information
 * Only runs in development environment
 * @example
 * ```ts
 * analyzeBundleSize();
 * // Logs: "📊 Bundle Performance Metrics: { loadTime: '1234ms', ... }"
 * ```
 */

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

export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV !== "development") return;

  const performanceEntries = performance.getEntriesByType("navigation");
  /**
   * Marks unused exports for removal in production builds
   * Shows a warning in non-production environments about tree-shaking
   * @example
   * ```ts
   * markUnusedExports();
   * // Warns about unused export removal in production
   * ```
   */
  if (performanceEntries.length > 0) {
    const navEntry = performanceEntries[0] as PerformanceNavigationTiming;
    console.log("📊 Bundle Performance Metrics:", {
      loadTime: `${Math.round(navEntry.loadEventEnd - navEntry.fetchStart)}ms`,
      domContentLoaded: `${Math.round(navEntry.domContentLoadedEventEnd - navEntry.fetchStart)}ms`,
      firstPaint: "Check DevTools Performance tab",
    });
  }
};
/**
 * Code splitting strategies for different optimization approaches
 * Provides dynamic import functions organized by route, feature, or size
 * @property byRoute - Import functions organized by application routes
 * @property byFeature - Import functions organized by feature modules
 * @property bySize - Import functions for large third-party libraries
 * @example
 * ```ts
 * const { home } = SplittingStrategies.byRoute();
 * const HomePage = await home();
 * ```
 */

export const markUnusedExports = () => {
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "Development mode - unused exports will be removed in production",
    );
  }
};

export const SplittingStrategies = {
  byRoute: () => ({
    home: () => import("@/app/page"),
    terminal: () => import("@/components/terminal/Terminal"),
    customization: () =>
      import("@/components/customization/CustomizationManager"),
  }),

  byFeature: () => ({
    themes: () => import("@/lib/themes/themeConfig"),
    commands: () => import("@/lib/commands/commandRegistry"),
    roadmap: () => import("@/lib/services/roadmapService"),
  }),

  bySize: () => ({
    charts: () => import("recharts"),
    icons: () => import("lucide-react"),
    ui: () => import("@radix-ui/react-dialog"),
  }),
};

/**
 * Adds DNS prefetch and preconnect resource hints to improve connection performance
 * Tells the browser to resolve DNS and establish connections early
 * @example
 * ```ts
 * addResourceHints();
 * // Adds dns-prefetch for fonts.googleapis.com and preconnect for fonts.gstatic.com
 * ```
 */
export const addResourceHints = () => {
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

  const preconnect = ["https://fonts.gstatic.com"];

  preconnect.forEach((origin) => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = origin;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  });
};

/**
 * Optimizes third-party script loading by deferring analytics and tracking scripts
 * Prevents blocking of main content by deferring non-critical scripts
 * @example
 * ```ts
 * optimizeThirdParty();
 * // All analytics/tracking scripts get defer attribute
 * ```
 */
export const optimizeThirdParty = () => {
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

/**
 * Optimizes memory usage by cleaning up event listeners and old localStorage items
 * Periodically checks for excessive event listeners and removes expired cache items
 * @example
 * ```ts
 * optimizeMemoryUsage();
 * // Starts periodic cleanup of listeners and storage
 * ```
 */
export const optimizeMemoryUsage = () => {
  const cleanupListeners = () => {
    const unusedEvents = ["resize", "scroll", "touchmove"];
    unusedEvents.forEach((event) => {
      const listeners = (
        window as Window & {_eventListeners?: Record<string, unknown[]>}
      )._eventListeners?.[event];
      if (listeners && listeners.length > 10) {
        console.warn(`Many ${event} listeners detected. Consider cleanup.`);
      }
    });
  };

  setInterval(cleanupListeners, 30000);

  const clearOldStorage = () => {
    const MS_IN_DAY = 24 * 60 * 60 * 1000;

    /**
     * @description Check if the data is a data with a timestamp
     * @param {unknown} data - The data to check
     * @returns {boolean} True if the data is a data with a timestamp, false otherwise
     */
    function isDataWithTimestamp(data: unknown): data is {timestamp: number} {
      return (
        typeof data === "object" &&
        data !== null &&
        "timestamp" in data &&
        typeof (data as {timestamp: unknown}).timestamp === "number"
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

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearOldStorage();
    }
  });
};

/**
 * Initializes all bundle optimization strategies
 * Orchestrates preloading, prefetching, and optimization of resources
 * Automatically runs based on document ready state
 * @example
 * ```ts
 * initBundleOptimizations();
 * // Applies all optimization strategies
 * ```
 */
export const initBundleOptimizations = () => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      preloadCriticalResources();
      addResourceHints();
      optimizeImageLoading();
      optimizeThirdParty();
      optimizeMemoryUsage();

      if (process.env.NODE_ENV === "development") {
        setTimeout(analyzeBundleSize, 2000);
      }
    });
  } else {
    preloadCriticalResources();
    addResourceHints();
    optimizeImageLoading();
    optimizeThirdParty();
    optimizeMemoryUsage();
  }

  setTimeout(prefetchResources, 3000);
};
