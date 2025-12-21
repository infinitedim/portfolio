/**
 * Test utilities and helpers for backend tests
 */
import { vi, type Mock } from "vitest";
import type { PrismaClient } from "../../prisma/generated/prisma/client";
import type { Request, Response, NextFunction } from "express";

// Re-export common testing utilities
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
 * Create a comprehensive mock Prisma client
 */
export function createMockPrismaClient(): {
  client: PrismaClient;
  mocks: Record<string, Record<string, Mock>>;
} {
  const createModelMocks = () => ({
    findUnique: vi.fn().mockResolvedValue(null),
    findUniqueOrThrow: vi.fn().mockRejectedValue(new Error("Not found")),
    findFirst: vi.fn().mockResolvedValue(null),
    findFirstOrThrow: vi.fn().mockRejectedValue(new Error("Not found")),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi
      .fn()
      .mockImplementation((data) =>
        Promise.resolve({ id: "mock-id", ...data.data }),
      ),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update: vi
      .fn()
      .mockImplementation((args) =>
        Promise.resolve({ id: args.where.id, ...args.data }),
      ),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    upsert: vi
      .fn()
      .mockImplementation((args) =>
        Promise.resolve({ id: "mock-id", ...args.create }),
      ),
    delete: vi.fn().mockResolvedValue({ id: "mock-id" }),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({}),
    groupBy: vi.fn().mockResolvedValue([]),
  });

  const mocks = {
    user: createModelMocks(),
    admin: createModelMocks(),
    project: createModelMocks(),
    blogPost: createModelMocks(),
    spotify: createModelMocks(),
    session: createModelMocks(),
    auditLog: createModelMocks(),
  };

  const client = {
    ...mocks,
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $transaction: vi.fn().mockImplementation((arg) => {
      if (typeof arg === "function") {
        return arg(client);
      }
      return Promise.all(arg);
    }),
    $queryRaw: vi.fn().mockResolvedValue([]),
    $executeRaw: vi.fn().mockResolvedValue(0),
    $queryRawUnsafe: vi.fn().mockResolvedValue([]),
    $executeRawUnsafe: vi.fn().mockResolvedValue(0),
  } as unknown as PrismaClient;

  return { client, mocks };
}

/**
 * Create a mock Redis client
 */
export function createMockRedisClient(): {
  client: {
    get: Mock;
    set: Mock;
    del: Mock;
    exists: Mock;
    expire: Mock;
    ttl: Mock;
    incr: Mock;
    decr: Mock;
    hget: Mock;
    hset: Mock;
    hdel: Mock;
    hgetall: Mock;
    sadd: Mock;
    srem: Mock;
    smembers: Mock;
    sismember: Mock;
    zadd: Mock;
    zrem: Mock;
    zrange: Mock;
    zrangebyscore: Mock;
    pipeline: Mock;
    multi: Mock;
  };
  reset: () => void;
} {
  const client = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(-1),
    incr: vi.fn().mockResolvedValue(1),
    decr: vi.fn().mockResolvedValue(0),
    hget: vi.fn().mockResolvedValue(null),
    hset: vi.fn().mockResolvedValue(1),
    hdel: vi.fn().mockResolvedValue(1),
    hgetall: vi.fn().mockResolvedValue({}),
    sadd: vi.fn().mockResolvedValue(1),
    srem: vi.fn().mockResolvedValue(1),
    smembers: vi.fn().mockResolvedValue([]),
    sismember: vi.fn().mockResolvedValue(0),
    zadd: vi.fn().mockResolvedValue(1),
    zrem: vi.fn().mockResolvedValue(1),
    zrange: vi.fn().mockResolvedValue([]),
    zrangebyscore: vi.fn().mockResolvedValue([]),
    pipeline: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    }),
    multi: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    }),
  };

  return {
    client,
    reset: () => {
      Object.values(client).forEach((mock) => {
        if (typeof mock === "function" && "mockClear" in mock) {
          mock.mockClear();
        }
      });
    },
  };
}

/**
 * Create a mock Express request
 */
export function createMockRequest(overrides?: Partial<Request>): Request {
  const headers: Record<string, string> = {};
  const req = {
    body: {},
    params: {},
    query: {},
    headers,
    cookies: {},
    ip: "127.0.0.1",
    method: "GET",
    path: "/",
    url: "/",
    originalUrl: "/",
    baseUrl: "",
    hostname: "localhost",
    protocol: "http",
    secure: false,
    xhr: false,
    get: vi.fn((name: string) => headers[name.toLowerCase()]),
    header: vi.fn((name: string) => headers[name.toLowerCase()]),
    accepts: vi.fn().mockReturnValue(true),
    acceptsCharsets: vi.fn().mockReturnValue(true),
    acceptsEncodings: vi.fn().mockReturnValue(true),
    acceptsLanguages: vi.fn().mockReturnValue(true),
    is: vi.fn().mockReturnValue(false),
    ...overrides,
  } as unknown as Request;

  return req;
}

/**
 * Create a mock Express response
 */
export function createMockResponse(): Response & {
  _status: number;
  _json: unknown;
  _headers: Record<string, string>;
} {
  const res = {
    _status: 200,
    _json: null,
    _headers: {} as Record<string, string>,
    status: vi.fn(function (this: typeof res, code: number) {
      this._status = code;
      return this;
    }),
    json: vi.fn(function (this: typeof res, data: unknown) {
      this._json = data;
      return this;
    }),
    send: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
    set: vi.fn(function (this: typeof res, name: string, value: string) {
      this._headers[name] = value;
      return this;
    }),
    setHeader: vi.fn(function (this: typeof res, name: string, value: string) {
      this._headers[name] = value;
      return this;
    }),
    get: vi.fn(function (this: typeof res, name: string) {
      return this._headers[name];
    }),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis(),
    type: vi.fn().mockReturnThis(),
    contentType: vi.fn().mockReturnThis(),
    format: vi.fn().mockReturnThis(),
    attachment: vi.fn().mockReturnThis(),
    sendFile: vi.fn().mockReturnThis(),
    download: vi.fn().mockReturnThis(),
    links: vi.fn().mockReturnThis(),
    vary: vi.fn().mockReturnThis(),
    render: vi.fn().mockReturnThis(),
    locals: {},
    headersSent: false,
  } as unknown as Response & {
    _status: number;
    _json: unknown;
    _headers: Record<string, string>;
  };

  return res;
}

/**
 * Create a mock NextFunction
 */
export function createMockNext(): NextFunction & Mock {
  return vi.fn() as NextFunction & Mock;
}

/**
 * Create test JWT tokens
 */
export function createTestToken(
  payload?: Record<string, unknown>,
  options?: { expired?: boolean },
): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = options?.expired ? now - 3600 : now + 3600;

  const header = { alg: "HS256", typ: "JWT" };
  const body = {
    sub: "test-user-id",
    email: "test@example.com",
    iat: now,
    exp,
    ...payload,
  };

  // Simple base64 encoding for test tokens
  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  return `${encode(header)}.${encode(body)}.test-signature`;
}

/**
 * Create test user data
 */
export function createTestUser(overrides?: Record<string, unknown>): {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Create test admin data
 */
export function createTestAdmin(overrides?: Record<string, unknown>): {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: "test-admin-id",
    email: "admin@example.com",
    name: "Test Admin",
    password: "hashed-password",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Create test project data
 */
export function createTestProject(overrides?: Record<string, unknown>): {
  id: string;
  title: string;
  description: string;
  slug: string;
  imageUrl: string | null;
  technologies: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  featured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: "test-project-id",
    title: "Test Project",
    description: "A test project description",
    slug: "test-project",
    imageUrl: "https://example.com/image.jpg",
    technologies: ["TypeScript", "React", "Node.js"],
    githubUrl: "https://github.com/test/project",
    liveUrl: "https://test-project.com",
    featured: false,
    order: 0,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Create test blog post data
 */
export function createTestBlogPost(overrides?: Record<string, unknown>): {
  id: string;
  title: string;
  content: string;
  slug: string;
  excerpt: string | null;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: "test-blog-id",
    title: "Test Blog Post",
    content: "This is a test blog post content.",
    slug: "test-blog-post",
    excerpt: "A test excerpt",
    published: true,
    publishedAt: new Date("2024-01-01"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Wait for async operations to complete
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
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

/**
 * Mock NestJS Test Module builder
 */
export function createMockTestingModule(): {
  providers: unknown[];
  addProvider: (provider: unknown) => void;
  compile: () => Promise<{
    get: <T>(token: unknown) => T;
    resolve: <T>(token: unknown) => Promise<T>;
  }>;
} {
  const providers: unknown[] = [];
  const instances = new Map<unknown, unknown>();

  return {
    providers,
    addProvider: (provider: unknown) => {
      providers.push(provider);
    },
    compile: async () => ({
      get: <T>(token: unknown): T => instances.get(token) as T,
      resolve: async <T>(token: unknown): Promise<T> =>
        instances.get(token) as T,
    }),
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
