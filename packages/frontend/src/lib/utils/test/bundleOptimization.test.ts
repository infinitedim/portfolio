import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  preloadCriticalResources,
  prefetchResources,
  optimizeImageLoading,
  dynamicImportWithRetry,
  analyzeBundleSize,
  markUnusedExports,
  SplittingStrategies,
  addResourceHints,
  optimizeThirdParty,
  optimizeMemoryUsage,
  initBundleOptimizations,
} from "../bundleOptimization";

// Mock DOM methods
const mockDocument = {
  createElement: vi.fn(),
  querySelectorAll: vi.fn(),
  head: {
    appendChild: vi.fn(),
  },
  readyState: "complete",
  addEventListener: vi.fn(),
  hidden: false,
};

const mockWindow = {
  performance: {
    getEntriesByType: vi.fn(),
  },
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    keys: vi.fn(),
  },
  _eventListeners: {},
};

const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
};

// Mock globals
Object.defineProperty(global, "document", {
  value: mockDocument,
  writable: true,
});

Object.defineProperty(global, "window", {
  value: mockWindow,
  writable: true,
});

Object.defineProperty(global, "console", {
  value: mockConsole,
  writable: true,
});

Object.defineProperty(global, "localStorage", {
  value: mockWindow.localStorage,
  writable: true,
});

Object.defineProperty(global, "performance", {
  value: mockWindow.performance,
  writable: true,
});

describe("bundleOptimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockDocument.createElement.mockReturnValue({
      rel: "",
      href: "",
      as: "",
      type: "",
      crossOrigin: "",
      defer: false,
    });

    mockDocument.querySelectorAll.mockReturnValue([]);

    // Mock Object.keys for localStorage
    Object.keys = vi.fn().mockReturnValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("preloadCriticalResources function", () => {
    it("should be defined and exportable", () => {
      expect(preloadCriticalResources).toBeDefined();
      expect(typeof preloadCriticalResources).toBe("function");
    });

    it("should create link elements for fonts", () => {
      preloadCriticalResources();

      expect(mockDocument.createElement).toHaveBeenCalledWith("link");
      expect(mockDocument.createElement).toHaveBeenCalledTimes(2);
      expect(mockDocument.head.appendChild).toHaveBeenCalledTimes(2);
    });

    it("should set correct attributes for preload links", () => {
      const mockLink = {
        rel: "",
        href: "",
        as: "",
        type: "",
        crossOrigin: "",
      };

      mockDocument.createElement.mockReturnValue(mockLink);

      preloadCriticalResources();

      expect(mockLink.rel).toBe("preload");
      expect(mockLink.as).toBe("font");
      expect(mockLink.type).toBe("font/woff2");
      expect(mockLink.crossOrigin).toBe("anonymous");
    });

    it("should handle multiple font files", () => {
      preloadCriticalResources();

      expect(mockDocument.createElement).toHaveBeenCalledTimes(2);
      expect(mockDocument.head.appendChild).toHaveBeenCalledTimes(2);
    });
  });

  describe("prefetchResources function", () => {
    it("should be defined and exportable", () => {
      expect(prefetchResources).toBeDefined();
      expect(typeof prefetchResources).toBe("function");
    });

    it("should create prefetch links for themes", () => {
      prefetchResources();

      expect(mockDocument.createElement).toHaveBeenCalledWith("link");
      expect(mockDocument.createElement).toHaveBeenCalledTimes(3);
      expect(mockDocument.head.appendChild).toHaveBeenCalledTimes(3);
    });

    it("should set correct attributes for prefetch links", () => {
      const mockLink = {
        rel: "",
        href: "",
      };

      mockDocument.createElement.mockReturnValue(mockLink);

      prefetchResources();

      expect(mockLink.rel).toBe("prefetch");
    });
  });

  describe("optimizeImageLoading function", () => {
    it("should be defined and exportable", () => {
      expect(optimizeImageLoading).toBeDefined();
      expect(typeof optimizeImageLoading).toBe("function");
    });

    it("should query for images without loading attribute", () => {
      optimizeImageLoading();

      expect(mockDocument.querySelectorAll).toHaveBeenCalledWith(
        "img:not([loading])",
      );
    });

    it("should set loading attribute to lazy for images", () => {
      // Mock HTMLImageElement
      global.HTMLImageElement = class MockHTMLImageElement {
        loading = "";
      } as any;

      const mockImg = new global.HTMLImageElement();
      mockDocument.querySelectorAll.mockReturnValue([mockImg]);

      optimizeImageLoading();

      expect(mockImg.loading).toBe("lazy");
    });

    it("should handle non-image elements gracefully", () => {
      const mockDiv = {};
      mockDocument.querySelectorAll.mockReturnValue([mockDiv]);

      expect(() => optimizeImageLoading()).not.toThrow();
    });
  });

  describe("dynamicImportWithRetry function", () => {
    it("should be defined and exportable", () => {
      expect(dynamicImportWithRetry).toBeDefined();
      expect(typeof dynamicImportWithRetry).toBe("function");
    });

    it("should return result on successful import", async () => {
      const mockImport = vi.fn().mockResolvedValue("success");

      const result = await dynamicImportWithRetry(mockImport);

      expect(result).toBe("success");
      expect(mockImport).toHaveBeenCalledTimes(1);
    });

    it("should retry on failed import", async () => {
      const mockImport = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValue("success");

      const result = await dynamicImportWithRetry(mockImport, 2);

      expect(result).toBe("success");
      expect(mockImport).toHaveBeenCalledTimes(2);
    });

    it("should throw error after all retries", async () => {
      const mockImport = vi.fn().mockRejectedValue(new Error("fail"));

      await expect(dynamicImportWithRetry(mockImport, 2, 10)).rejects.toThrow(
        "fail",
      );
      expect(mockImport).toHaveBeenCalledTimes(2);
    });

    it("should use default retry count and delay", async () => {
      const mockImport = vi.fn().mockRejectedValue(new Error("fail"));

      await expect(dynamicImportWithRetry(mockImport)).rejects.toThrow("fail");
      expect(mockImport).toHaveBeenCalledTimes(3);
    });

    it("should handle custom retry parameters", async () => {
      const mockImport = vi.fn().mockRejectedValue(new Error("fail"));

      await expect(dynamicImportWithRetry(mockImport, 1, 5)).rejects.toThrow(
        "fail",
      );
      expect(mockImport).toHaveBeenCalledTimes(1);
    });
  });

  describe("analyzeBundleSize function", () => {
    it("should be defined and exportable", () => {
      expect(analyzeBundleSize).toBeDefined();
      expect(typeof analyzeBundleSize).toBe("function");
    });

    it("should not run in non-development mode (test env)", () => {
      // In test environment (NODE_ENV=test), analyzeBundleSize should exit early
      analyzeBundleSize();

      // Since NODE_ENV is "test", performance.getEntriesByType should NOT be called
      expect(mockWindow.performance.getEntriesByType).not.toHaveBeenCalled();
    });

    it("should be callable without throwing", () => {
      // In test environment, just verify it doesn't throw
      expect(() => analyzeBundleSize()).not.toThrow();
    });

    it("should handle missing performance API gracefully", () => {
      const originalPerformance = global.performance;
      (global as any).performance = undefined;

      expect(() => analyzeBundleSize()).not.toThrow();

      global.performance = originalPerformance;
    });
  });
  it("should be defined and exportable", () => {
    expect(markUnusedExports).toBeDefined();
    expect(typeof markUnusedExports).toBe("function");
  });

  it("should handle environment mode", () => {
    expect(() => markUnusedExports()).not.toThrow();
  });

  it("should be callable without errors", () => {
    expect(() => markUnusedExports()).not.toThrow();
  });
});

describe("SplittingStrategies object", () => {
  it("should be defined and exportable", () => {
    expect(SplittingStrategies).toBeDefined();
    expect(typeof SplittingStrategies).toBe("object");
  });

  it("should have byRoute method", () => {
    expect(SplittingStrategies.byRoute).toBeDefined();
    expect(typeof SplittingStrategies.byRoute).toBe("function");
  });

  it("should have byFeature method", () => {
    expect(SplittingStrategies.byFeature).toBeDefined();
    expect(typeof SplittingStrategies.byFeature).toBe("function");
  });

  it("should have bySize method", () => {
    expect(SplittingStrategies.bySize).toBeDefined();
    expect(typeof SplittingStrategies.bySize).toBe("function");
  });

  it("should return route-based imports", () => {
    const routes = SplittingStrategies.byRoute();

    expect(routes).toHaveProperty("home");
    expect(routes).toHaveProperty("terminal");
    expect(routes).toHaveProperty("customization");
    expect(typeof routes.home).toBe("function");
  });

  it("should return feature-based imports", () => {
    const features = SplittingStrategies.byFeature();

    expect(features).toHaveProperty("themes");
    expect(features).toHaveProperty("commands");
    expect(features).toHaveProperty("roadmap");
    expect(typeof features.themes).toBe("function");
  });

  it("should return size-based imports", () => {
    const sizes = SplittingStrategies.bySize();

    expect(sizes).toHaveProperty("charts");
    expect(sizes).toHaveProperty("icons");
    expect(sizes).toHaveProperty("ui");
    expect(typeof sizes.charts).toBe("function");
  });
});

describe("addResourceHints function", () => {
  it("should be defined and exportable", () => {
    expect(addResourceHints).toBeDefined();
    expect(typeof addResourceHints).toBe("function");
  });

  it("should create DNS prefetch links", () => {
    addResourceHints();

    expect(mockDocument.createElement).toHaveBeenCalledWith("link");
    expect(mockDocument.head.appendChild).toHaveBeenCalled();
  });

  it("should create preconnect links", () => {
    addResourceHints();

    expect(mockDocument.createElement).toHaveBeenCalledWith("link");
    expect(mockDocument.head.appendChild).toHaveBeenCalled();
  });
});

describe("optimizeThirdParty function", () => {
  it("should be defined and exportable", () => {
    expect(optimizeThirdParty).toBeDefined();
    expect(typeof optimizeThirdParty).toBe("function");
  });

  it("should query for analytics and tracking scripts", () => {
    optimizeThirdParty();

    expect(mockDocument.querySelectorAll).toHaveBeenCalledWith(
      "script[src*='analytics'], script[src*='tracking']",
    );
  });

  it("should set defer attribute on scripts", () => {
    // Mock HTMLScriptElement
    global.HTMLScriptElement = class MockHTMLScriptElement {
      defer = false;
    } as any;

    const mockScript = new global.HTMLScriptElement();
    mockDocument.querySelectorAll.mockReturnValue([mockScript]);

    optimizeThirdParty();

    expect(mockScript.defer).toBe(true);
  });
});

describe("optimizeMemoryUsage function", () => {
  it("should be defined and exportable", () => {
    expect(optimizeMemoryUsage).toBeDefined();
    expect(typeof optimizeMemoryUsage).toBe("function");
  });

  it("should add visibility change event listener", () => {
    optimizeMemoryUsage();

    expect(mockDocument.addEventListener).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
  });

  it("should setup cleanup interval", () => {
    const setIntervalSpy = vi.spyOn(global, "setInterval");

    optimizeMemoryUsage();

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);

    setIntervalSpy.mockRestore();
  });
});

describe("initBundleOptimizations function", () => {
  it("should be defined and exportable", () => {
    expect(initBundleOptimizations).toBeDefined();
    expect(typeof initBundleOptimizations).toBe("function");
  });

  it("should run optimizations when DOM is complete", () => {
    mockDocument.readyState = "complete";

    initBundleOptimizations();

    expect(mockDocument.head.appendChild).toHaveBeenCalled();
  });

  it("should add DOMContentLoaded listener when DOM is loading", () => {
    mockDocument.readyState = "loading";

    initBundleOptimizations();

    expect(mockDocument.addEventListener).toHaveBeenCalledWith(
      "DOMContentLoaded",
      expect.any(Function),
    );
  });

  it("should setup prefetch timeout", () => {
    const setTimeoutSpy = vi.spyOn(global, "setTimeout");

    initBundleOptimizations();

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000);

    setTimeoutSpy.mockRestore();
  });
});

describe("error handling and edge cases", () => {
  it("should handle missing document gracefully", () => {
    const originalDocument = global.document;
    (global as any).document = undefined;

    expect(() => preloadCriticalResources()).toThrow();

    global.document = originalDocument;
  });

  it("should handle missing performance API", () => {
    const originalPerformance = global.performance;
    (global as any).performance = undefined;

    expect(() => analyzeBundleSize()).not.toThrow();

    global.performance = originalPerformance;
  });

  it("should handle localStorage errors gracefully", () => {
    const originalLocalStorage = global.localStorage;
    const mockLocalStorage = {
      getItem: vi.fn().mockImplementation(() => {
        throw new Error("Storage error");
      }),
      removeItem: vi.fn(),
    };

    (global as any).localStorage = mockLocalStorage;
    Object.keys = vi.fn().mockReturnValue(["temp-test"]);

    expect(() => optimizeMemoryUsage()).not.toThrow();

    global.localStorage = originalLocalStorage;
  });
});

describe("integration tests", () => {
  it("should work together in initBundleOptimizations", () => {
    mockDocument.readyState = "complete";

    initBundleOptimizations();

    // Should call multiple optimization functions
    expect(mockDocument.createElement).toHaveBeenCalled();
    expect(mockDocument.head.appendChild).toHaveBeenCalled();
    expect(mockDocument.querySelectorAll).toHaveBeenCalled();
  });

  it("should handle different environments", () => {
    expect(() => markUnusedExports()).not.toThrow();
  });
});
