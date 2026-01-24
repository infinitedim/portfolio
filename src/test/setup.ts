import { vi, afterEach, beforeAll, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock Next.js modules
vi.mock("next/server", () => ({
  NextRequest: class MockNextRequest {
    url: string;
    method: string;
    private _headers: Map<string, string>;
    nextUrl: { pathname: string };
    private _cookies: Map<string, unknown>;
    geo?: { country?: string; region?: string };

    constructor(
      url = "http://127.0.0.1:3000",
      options: Record<string, unknown> = {},
    ) {
      this.url = url;
      this.method = (options.method as string) || "GET";
      this._headers = new Map((options.headers as [string, string][]) || []);
      this.nextUrl = { pathname: (options.pathname as string) || "/" };
      this._cookies = new Map((options.cookies as [string, unknown][]) || []);
      this.geo = (options.geo as { country?: string; region?: string }) || {
        country: "US",
        region: "CA",
      };
    }

    get headers() {
      return {
        get: (name: string) => this._headers.get(name) || null,
        set: (name: string, value: string) => this._headers.set(name, value),
        entries: () => Array.from(this._headers.entries()),
      };
    }

    get cookies() {
      return {
        get: (name: string) => this._cookies.get(name) || null,
        set: (
          name: string,
          value: unknown,
          options?: Record<string, unknown>,
        ) => {
          this._cookies.set(name, { value, ...options });
        },
      };
    }
  },

  NextResponse: {
    next: () => ({
      headers: {
        set: vi.fn(),
        get: vi.fn(),
        entries: () => [],
      },
      cookies: {
        set: vi.fn(),
        get: vi.fn(),
      },
    }),
  },
}));

// Mock crypto for nonce generation
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: vi.fn(() => "test-uuid-12345"),
    randomBytes: vi.fn(() => ({
      toString: () => "test-nonce-base64",
    })),
  },
  writable: true,
});

// Mock centralized logger (local mock since we don't import from backend)
vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    http: vi.fn(),
  },
  logSecurity: vi.fn(),
  logPerformance: vi.fn(),
  logAPICall: vi.fn(),
}));

// Mock trpc - removed since we don't use it anymore

// Mock security functions (local mock)
vi.mock("@/lib/security/csp", () => ({
  generateNonce: vi.fn(() => "test-nonce"),
  getSecurityHeaders: vi.fn(() => ({
    "Content-Security-Policy": "test-csp",
    "X-XSS-Protection": "1; mode=block",
  })),
  getCORSHeaders: vi.fn(() => ({
    "Access-Control-Allow-Origin": "http://127.0.0.1:3000",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
  })),
}));

// Mock environment variables
process.env.ALLOWED_ORIGINS =
  process.env.ALLOWED_ORIGINS || "http://127.0.0.1:3000,https://example.com";

// Ensure document and window are properly set up for jsdom
// This must run synchronously when the file is loaded, not in a hook
// Use a function to ensure DOM is ready
function ensureDOMReady() {
  if (typeof document === "undefined") {
    return;
  }

  if (!document.documentElement) {
    const html = document.createElement("html");
    try {
      if (typeof document.appendChild === "function") {
        document.appendChild(html);
      }
    } catch (error) {
      if(error instanceof Error) {
        throw Error("Failed to append documentElement to document: " + error.message);
      }
    }
  }


  if (!document.body && document.documentElement) {
    const body = document.createElement("body");
    document.documentElement.appendChild(body);
  }

  if (!document.body && document.documentElement) {
    try {
      const body = document.createElement("body");
      document.documentElement.appendChild(body);
    } catch (error) {
      console.log("Failed to append body to documentElement:", error);

      try {
        document.body = document.createElement("body");
      } catch {
        // Last resort - ignore
      }
    }
  }
}

// Call immediately
ensureDOMReady();

// Use beforeAll as a fallback to ensure this runs after jsdom is initialized
beforeAll(() => {
  ensureDOMReady();
});

// NOTE: Date.now and Math.random are NOT mocked globally to avoid issues
// with tests that depend on unique IDs or timestamps.
// Mock them locally in individual tests if needed.

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock window.location
  Object.defineProperty(window, "location", {
    writable: true,
    value: {
      href: "http://localhost:3000",
      origin: "http://localhost:3000",
      protocol: "http:",
      host: "localhost:3000",
      hostname: "localhost",
      port: "3000",
      pathname: "/",
      search: "",
      hash: "",
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
  });
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
}

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Mock URL.createObjectURL
Object.defineProperty(URL, "createObjectURL", {
  value: vi.fn(() => "mock-blob-url"),
  writable: true,
});

// Mock URL.revokeObjectURL
Object.defineProperty(URL, "revokeObjectURL", {
  value: vi.fn(),
  writable: true,
});

// Additional check in beforeAll to ensure document.body exists
// This is a fallback in case the first beforeAll didn't work
beforeAll(() => {
  ensureDOMReady();
});

// Ensure DOM is ready before each test
beforeEach(() => {
  ensureDOMReady();
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});
