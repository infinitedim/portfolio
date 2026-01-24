/**
 * Test utilities and helpers for frontend tests
 */
import { vi, type Mock } from "vitest";
import React, { type ReactElement, type ReactNode } from "react";

// Re-export common testing library functions for convenience
export { vi } from "vitest";

/**
 * Type-safe mock function creator
 */
export function createMock<T extends (...args: unknown[]) => unknown>(
  implementation?: T,
): Mock<T> {
  return vi.fn(implementation) as Mock<T>;
}

/**
 * Mock fetch responses
 */
export function mockFetch(
  responses: Array<{
    url?: string | RegExp;
    method?: string;
    response: unknown;
    status?: number;
    ok?: boolean;
  }>,
): void {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = init?.method || "GET";

    const match = responses.find((r) => {
      const urlMatch = r.url
        ? typeof r.url === "string"
          ? url.includes(r.url)
          : r.url.test(url)
        : true;
      const methodMatch = r.method
        ? r.method.toUpperCase() === method.toUpperCase()
        : true;
      return urlMatch && methodMatch;
    });

    if (match) {
      return Promise.resolve({
        ok: match.ok ?? true,
        status: match.status ?? 200,
        json: () => Promise.resolve(match.response),
        text: () => Promise.resolve(JSON.stringify(match.response)),
        headers: new Headers(),
      } as Response);
    }

    return Promise.reject(new Error(`No mock found for ${method} ${url}`));
  });

  global.fetch = fetchMock;
}

/**
 * Reset fetch mock
 */
export function resetFetchMock(): void {
  global.fetch = vi.fn();
}

/**
 * Create a mock tRPC client for testing
 */
export function createMockTRPCClient<T extends Record<string, unknown>>(
  overrides?: Partial<T>,
): T {
  const handler: ProxyHandler<object> = {
    get(target, prop) {
      if (overrides && prop in overrides) {
        return overrides[prop as keyof T];
      }
      // Return a proxy that handles nested access and method calls
      return new Proxy(
        {},
        {
          get(_, nestedProp) {
            if (nestedProp === "query" || nestedProp === "mutate") {
              return vi.fn().mockResolvedValue(undefined);
            }
            if (nestedProp === "useQuery" || nestedProp === "useMutation") {
              return vi.fn().mockReturnValue({
                data: undefined,
                isLoading: false,
                isError: false,
                error: null,
                refetch: vi.fn(),
                mutate: vi.fn(),
                mutateAsync: vi.fn(),
              });
            }
            return vi.fn();
          },
        },
      );
    },
  };

  return new Proxy({}, handler) as T;
}

/**
 * Mock localStorage with typed values
 */
export function createMockLocalStorage(
  initialData: Record<string, string> = {},
): {
  getItem: Mock;
  setItem: Mock;
  removeItem: Mock;
  clear: Mock;
  store: Record<string, string>;
} {
  const store: Record<string, string> = { ...initialData };

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    store,
  };
}

/**
 * Mock session storage
 */
export function createMockSessionStorage(
  initialData: Record<string, string> = {},
): ReturnType<typeof createMockLocalStorage> {
  return createMockLocalStorage(initialData);
}

/**
 * Wait for promises to resolve
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Wait for a specific condition
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error("Condition not met within timeout");
}

/**
 * Mock date for testing
 */
export function mockDate(date: Date | string | number): {
  restore: () => void;
} {
  const mockDateObj = new Date(date);
  const originalDate = global.Date;

  const MockDate = class extends Date {
    constructor(value?: string | number | Date) {
      if (value === undefined) {
        super(mockDateObj);
      } else {
        super(value);
      }
    }

    static override now(): number {
      return mockDateObj.getTime();
    }
  } as DateConstructor;

  global.Date = MockDate;

  return {
    restore: () => {
      global.Date = originalDate;
    },
  };
}

/**
 * Mock timers with auto-cleanup
 */
export function useFakeTimers(): {
  advanceTimersByTime: (ms: number) => void;
  runAllTimers: () => void;
  restore: () => void;
} {
  vi.useFakeTimers();

  return {
    advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
    runAllTimers: () => vi.runAllTimers(),
    restore: () => vi.useRealTimers(),
  };
}

/**
 * Create a mock event
 */
export function createMockEvent<T extends Event>(
  type: string,
  props?: Partial<T>,
): T {
  const event = {
    type,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: {},
    currentTarget: {},
    ...props,
  } as unknown as T;
  return event;
}

/**
 * Mock IntersectionObserver entries
 */
export function createIntersectionObserverEntry(
  overrides?: Partial<IntersectionObserverEntry>,
): IntersectionObserverEntry {
  const rect = {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: vi.fn(),
  };
  return {
    boundingClientRect: rect,
    intersectionRatio: 1,
    intersectionRect: { ...rect },
    isIntersecting: true,
    rootBounds: null,
    target: document.createElement("div"),
    time: Date.now(),
    ...overrides,
  };
}

/**
 * Mock ResizeObserver entry
 */
export function createResizeObserverEntry(
  target: Element,
  overrides?: Partial<ResizeObserverEntry>,
): ResizeObserverEntry {
  const contentRect = {
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    toJSON: vi.fn(),
  };
  return {
    target,
    contentRect,
    borderBoxSize: [{ blockSize: 100, inlineSize: 100 }],
    contentBoxSize: [{ blockSize: 100, inlineSize: 100 }],
    devicePixelContentBoxSize: [{ blockSize: 100, inlineSize: 100 }],
    ...overrides,
  };
}

/**
 * Mock router for Next.js App Router
 */
export function createMockRouter(overrides?: {
  pathname?: string;
  searchParams?: Record<string, string>;
}): {
  push: Mock;
  replace: Mock;
  back: Mock;
  forward: Mock;
  refresh: Mock;
  prefetch: Mock;
  pathname: string;
  searchParams: URLSearchParams;
} {
  const searchParams = new URLSearchParams(overrides?.searchParams || {});

  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    pathname: overrides?.pathname || "/",
    searchParams,
  };
}

/**
 * Create typed mock props
 */
export function createMockProps<T extends Record<string, unknown>>(
  defaults: T,
  overrides?: Partial<T>,
): T {
  return { ...defaults, ...overrides };
}

/**
 * Wrapper to add providers for testing
 */
export interface TestProviderProps {
  children: ReactNode;
}

export function createTestProvider(
  providers: Array<React.ComponentType<TestProviderProps>>,
): React.ComponentType<TestProviderProps> {
  return function TestProvider({ children }: TestProviderProps) {
    return providers.reduceRight(
      (acc, Provider) => React.createElement(Provider, { children: acc }),
      children as ReactElement,
    );
  };
}

/**
 * Mock console methods
 */
export function mockConsole(): {
  log: Mock;
  warn: Mock;
  error: Mock;
  info: Mock;
  debug: Mock;
  restore: () => void;
} {
  const originalConsole = { ...console };
  const mocks = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };

  console.log = mocks.log;
  console.warn = mocks.warn;
  console.error = mocks.error;
  console.info = mocks.info;
  console.debug = mocks.debug;

  return {
    ...mocks,
    restore: () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
    },
  };
}

/**
 * Assert that an async function throws
 */
export async function expectToThrow(
  fn: () => Promise<unknown>,
  errorType?: new (...args: unknown[]) => Error,
  message?: string | RegExp,
): Promise<void> {
  let threw = false;
  let caughtError: Error | undefined;

  try {
    await fn();
  } catch (error) {
    threw = true;
    caughtError = error as Error;
  }

  if (!threw) {
    throw new Error("Expected function to throw, but it did not");
  }

  if (errorType && caughtError) {
    const isCorrectType = caughtError instanceof errorType;
    if (!isCorrectType) {
      const actualType = Object.getPrototypeOf(caughtError).constructor.name;
      throw new Error(
        `Expected error to be instance of ${errorType.name}, but got ${actualType}`,
      );
    }
  }

  if (message && caughtError) {
    const errorMessage = caughtError.message || "";
    if (typeof message === "string") {
      if (!errorMessage.includes(message)) {
        throw new Error(
          `Expected error message to include "${message}", but got "${errorMessage}"`,
        );
      }
    } else if (!message.test(errorMessage)) {
      throw new Error(
        `Expected error message to match ${message}, but got "${errorMessage}"`,
      );
    }
  }
}

/**
 * Create a deferred promise for testing async flows
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve: (value: T) => void;
  let reject: (error: Error) => void;

  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
}
