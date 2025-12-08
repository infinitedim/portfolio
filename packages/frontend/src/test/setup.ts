import { vi, afterEach, expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend vitest's expect with jest-dom matchers
expect.extend(matchers);

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

// Mock environment variables using vi.stubEnv
vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("ALLOWED_ORIGINS", "http://127.0.0.1:3000,https://example.com");

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

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

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

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});
