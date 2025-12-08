import { vi } from "vitest";

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.POSTGRES_PRISMA_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET =
  "test-jwt-secret-that-is-long-enough-to-meet-the-minimum-requirement-of-64-characters";
process.env.REFRESH_TOKEN_SECRET =
  "test-refresh-token-secret-that-is-long-enough-to-meet-the-minimum-requirement-of-64-characters";
process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-redis-token";
process.env.ADMIN_EMAIL = "admin@example.com";
process.env.ADMIN_PASSWORD = "admin";
process.env.FRONTEND_ORIGIN = "http://127.0.0.1:3000";
process.env.PORT = "4000";
process.env.LOG_LEVEL = "info";

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock Prisma
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn().mockImplementation((queries) => Promise.all(queries)),
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    blogPost: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    spotify: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    admin: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  })),
}));

// Mock Redis - Create a more robust mock that prevents actual HTTP calls
const mockRedisInstance = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(1),
  exists: vi.fn().mockResolvedValue(1),
  pipeline: vi.fn().mockResolvedValue([]),
  // Add any other methods that might be called
  mget: vi.fn().mockResolvedValue([]),
  mset: vi.fn().mockResolvedValue(undefined),
  flushdb: vi.fn().mockResolvedValue(undefined),
  ping: vi.fn().mockResolvedValue("PONG"),
};

// Mock the entire module to prevent any actual HTTP calls
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => mockRedisInstance),
  // Also mock any other exports that might exist
  createClient: vi.fn().mockImplementation(() => mockRedisInstance),
}));

// Mock JWT
vi.mock("jsonwebtoken", () => ({
  sign: vi.fn(() => "mock-jwt-token"),
  verify: vi.fn(() => ({ userId: "test-user-id" })),
}));

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  hash: vi.fn(() => "hashed-password"),
  compare: vi.fn(() => true),
}));

// Mock sanitize-html
vi.mock("sanitize-html", () => ({
  default: vi.fn((html) => html.replace(/<script[^>]*>.*?<\/script>/gi, "")),
}));

// Mock winston logger
vi.mock("@portfolio/backend/src/logging/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    http: vi.fn(), // Added http method
  },
  logSecurity: vi.fn(), // Added specialized loggers
  logPerformance: vi.fn(),
  logAPICall: vi.fn(),
}));

// Mock security functions
vi.mock("@portfolio/backend/src/security/csp", () => ({
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

// Mock cache-manager
vi.mock("cache-manager", () => ({
  caching: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    reset: vi.fn(),
    wrap: vi.fn(),
    store: {},
  }),
}));

// Mock environment validation to prevent actual validation during tests
vi.mock("@portfolio/backend/src/env.config", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    POSTGRES_PRISMA_URL: "postgresql://test:test@localhost:5432/test",
    JWT_SECRET:
      "test-jwt-secret-that-is-long-enough-to-meet-the-minimum-requirement-of-64-characters",
    REFRESH_TOKEN_SECRET:
      "test-refresh-token-secret-that-is-long-enough-to-meet-the-minimum-requirement-of-64-characters",
    UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "test-redis-token",
    ADMIN_EMAIL: "admin@example.com",
    ADMIN_PASSWORD: "admin",
    FRONTEND_ORIGIN: "http://127.0.0.1:3000",
    PORT: 4000,
    LOG_LEVEL: "info",
    JWT_EXPIRES_IN: "15m",
    REFRESH_TOKEN_EXPIRES_IN: "7d",
    JWT_ISSUER: "portfolio-app",
    JWT_AUDIENCE: "portfolio-users",
  },
  validateEnv: vi.fn(),
  validateSecrets: vi.fn(),
  isProduction: false,
  isDevelopment: false,
  isTest: true,
  getRequiredSecret: vi.fn(
    (name: string, value?: string) => value || "test-secret",
  ),
}));

// Mock AuthService to prevent circular dependencies
vi.mock("@portfolio/backend/src/auth/auth.service", () => ({
  AuthService: class MockAuthService {
    constructor() {}
    verify = vi.fn();
  },
}));

// Mock SecurityService to prevent circular dependencies
vi.mock("@portfolio/backend/src/security/security.service", () => ({
  SecurityService: class MockSecurityService {
    constructor() {}
  },
  SecurityEventType: {
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
  },
}));

// Mock AuditLogService to prevent circular dependencies
vi.mock("@portfolio/backend/src/security/audit-log.service", () => ({
  AuditLogService: class MockAuditLogService {
    constructor() {}
  },
  AuditEventType: {
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
  },
}));

// Mock CSRFTokenService to prevent circular dependencies
vi.mock("@portfolio/backend/src/security/csrf.service", () => ({
  CSRFTokenService: class MockCSRFTokenService {
    constructor() {}
  },
}));

// Note: We removed Date and Math global mocks as they break native functionality
// If you need consistent timestamps in tests, mock Date in individual test files

// Use vitest's proper environment stubbing
vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("ALLOWED_ORIGINS", "http://127.0.0.1:3000");
