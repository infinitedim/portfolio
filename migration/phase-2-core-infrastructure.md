# Phase 2: Core Infrastructure Setup

## 🎯 Tujuan Phase

Setup infrastruktur inti untuk NextJS full-stack: Prisma, Redis, Environment config, dan Logger.

**Estimasi Waktu: 2-3 hari**

---

## 📋 Task Checklist

### 2.1 Restructure Project

- [x] Update root `package.json` (added Prisma scripts)
- [ ] Move Prisma to root (deferred - keeping in packages/frontend for now)
- [ ] Update Turborepo config (not needed yet)
- [ ] Remove backend workspace references (will be done in Phase 6)

### 2.2 Database Layer

- [x] Create `src/server/db/prisma.ts`
- [x] Setup database connection pooling
- [x] Migrate Prisma schema
- [x] Create `prisma.config.ts` for migrations

### 2.3 Redis Layer

- [x] Create `src/server/redis/client.ts`
- [ ] Test Redis connectivity (manual testing required)

### 2.4 Environment Config

- [x] Create `src/server/config/env.ts`
- [x] Validate all required variables

### 2.5 Logger Setup

- [x] Create `src/server/utils/logger.ts`
- [x] Configure Winston for production

---

## 🏗️ Implementation Details

### 2.1 Project Restructure

#### 2.1.1 Update Root `package.json`

**Current workspaces:**

```json
{
  "workspaces": ["packages/*", "tools/*"]
}
```

**Target workspaces:**

```json
{
  "workspaces": ["packages/ui", "tools/*"]
}
```

> [!NOTE]
> Frontend akan dipindahkan ke root, backend dihapus setelah migrasi selesai.

#### 2.1.2 Move Frontend to Root (Gradual)

**Step 1:** Keep struktur existing, buat file baru di `packages/frontend/src/server/`

**Step 2:** Setelah migrasi complete, pindahkan semua ke root

Struktur sementara:

```
packages/
├── frontend/
│   └── src/
│       ├── app/
│       ├── server/           # NEW: Server-side code
│       │   ├── db/
│       │   ├── redis/
│       │   ├── services/
│       │   ├── trpc/
│       │   └── config/
│       ├── lib/
│       └── components/
├── ui/                       # Keep as shared UI
└── backend/                  # Will be removed later
```

---

### 2.2 Database Layer (Prisma)

#### 2.2.1 Create Prisma Client Singleton

**File:** `packages/frontend/src/server/db/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Environment variables
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Connection pool configuration
const poolConfig = {
  connectionString: DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || "10", 10),
  min: parseInt(process.env.DB_POOL_MIN || "2", 10),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || "30000", 10),
  connectionTimeoutMillis: parseInt(
    process.env.DB_POOL_ACQUIRE_TIMEOUT || "10000",
    10,
  ),
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
};

// Global pool instance
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);

    // Pool event handlers
    pool.on("error", (err) => {
      console.error("[Prisma Pool] Unexpected error:", err.message);
    });

    pool.on("connect", () => {
      console.log("[Prisma Pool] New client connected");
    });
  }
  return pool;
}

// Prisma client singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const poolInstance = getPool();
  const adapter = new PrismaPg(poolInstance);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Utility functions
export async function testDatabaseConnection(): Promise<{
  connected: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      connected: true,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      connected: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getDatabaseInfo(): Promise<{
  version: string;
  database: string;
  user: string;
}> {
  const result = await prisma.$queryRaw<
    Array<{
      version: string;
      database: string;
      user: string;
    }>
  >`
    SELECT
      version() as version,
      current_database() as database,
      current_user as user
  `;
  return result[0];
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  if (pool) {
    await pool.end();
    pool = null;
  }
}
```

#### 2.2.2 Create Database Index

**File:** `packages/frontend/src/server/db/index.ts`

```typescript
export {
  prisma,
  testDatabaseConnection,
  getDatabaseInfo,
  disconnectDatabase,
} from "./prisma";
export type { PrismaClient } from "@prisma/client";
```

#### 2.2.3 Move Prisma Schema

**From:** `packages/backend/prisma/schema.prisma`  
**To:** `packages/frontend/prisma/schema.prisma`

> [!IMPORTANT]
> Keep schema identical. Only change the output path if needed.

**Update schema.prisma generator:**

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}
```

#### 2.2.4 Create `prisma.config.ts` for Frontend

**File:** `packages/frontend/prisma.config.ts`

```typescript
import path from "path";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma/schema.prisma"),

  migrate: {
    async datasourceUrl() {
      const url =
        process.env.DATABASE_URL_NON_POOLING ?? process.env.DATABASE_URL;

      if (!url) {
        throw new Error("DATABASE_URL is required for migrations");
      }
      return url;
    },
  },

  studio: {
    async datasourceUrl() {
      return process.env.DATABASE_URL ?? "";
    },
  },
});
```

#### 2.2.5 Copy Migrations

```bash
# Copy migration folder
cp -r packages/backend/prisma/migrations packages/frontend/prisma/migrations
```

---

### 2.3 Redis Layer

#### 2.3.1 Create Redis Client

**File:** `packages/frontend/src/server/redis/client.ts`

```typescript
import { Redis } from "@upstash/redis";

// Environment validation
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Track availability
let redisAvailable = true;

// Global singleton
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis | null {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    console.warn("[Redis] Missing credentials, Redis features disabled");
    redisAvailable = false;
    return null;
  }

  try {
    return new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    console.error("[Redis] Failed to create client:", error);
    redisAvailable = false;
    return null;
  }
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}

// Redis Service Layer (replicates NestJS RedisService)
export const redisService = {
  isAvailable(): boolean {
    return redisAvailable && redis !== null;
  },

  async get<T = unknown>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
      return (await redis.get<T>(key)) ?? null;
    } catch (error) {
      console.error("[Redis] GET error:", error);
      return null;
    }
  },

  async set<T = unknown>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<boolean> {
    if (!redis) return false;
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await redis.set(key, value, { ex: ttlSeconds });
      } else {
        await redis.set(key, value);
      }
      return true;
    } catch (error) {
      console.error("[Redis] SET error:", error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    if (!redis) return false;
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error("[Redis] DEL error:", error);
      return false;
    }
  },

  async exists(key: string): Promise<boolean> {
    if (!redis) return false;
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error("[Redis] EXISTS error:", error);
      return false;
    }
  },

  async incr(key: string): Promise<number> {
    if (!redis) return 0;
    try {
      return await redis.incr(key);
    } catch (error) {
      console.error("[Redis] INCR error:", error);
      return 0;
    }
  },

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!redis) return false;
    try {
      await redis.expire(key, seconds);
      return true;
    } catch (error) {
      console.error("[Redis] EXPIRE error:", error);
      return false;
    }
  },

  async ttl(key: string): Promise<number> {
    if (!redis) return -2;
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error("[Redis] TTL error:", error);
      return -2;
    }
  },

  async keys(pattern: string): Promise<string[]> {
    if (!redis) return [];
    try {
      return await redis.keys(pattern);
    } catch (error) {
      console.error("[Redis] KEYS error:", error);
      return [];
    }
  },

  async ping(): Promise<string | null> {
    if (!redis) return null;
    try {
      return await redis.ping();
    } catch (error) {
      console.error("[Redis] PING error:", error);
      return null;
    }
  },

  async testConnection(): Promise<{
    status: "connected" | "disconnected";
    responseTime: number;
    error?: string;
  }> {
    const start = Date.now();
    if (!redis) {
      return {
        status: "disconnected",
        responseTime: Date.now() - start,
        error: "Redis client not initialized",
      };
    }

    try {
      await redis.ping();
      return {
        status: "connected",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: "disconnected",
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async info(): Promise<Record<string, unknown>> {
    if (!redis) {
      return { error: "Redis not available" };
    }

    const pingResult = await this.ping();
    return {
      redis_version: "Upstash Redis",
      connected_clients: 1,
      used_memory_human: "N/A",
      uptime_in_seconds: Math.floor(process.uptime()),
      ping: pingResult,
    };
  },
};

export type RedisService = typeof redisService;
```

#### 2.3.2 Create Redis Index

**File:** `packages/frontend/src/server/redis/index.ts`

```typescript
export { redis, redisService } from "./client";
export type { RedisService } from "./client";
```

---

### 2.4 Environment Configuration

#### 2.4.1 Create Environment Validation

**File:** `packages/frontend/src/server/config/env.ts`

```typescript
import { z } from "zod";

/**
 * Environment variable schema
 * Mirrors backend env.config.ts but adapted for Next.js
 */
const envSchema = z.object({
  // Core
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_URL_NON_POOLING: z.string().optional(),

  // Redis
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(64, "JWT_SECRET must be at least 64 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN: z
    .string()
    .min(64, "REFRESH_TOKEN must be at least 64 characters"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  JWT_ISSUER: z.string().default("portfolio-app"),
  JWT_AUDIENCE: z.string().default("portfolio-users"),

  // Admin
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be valid"),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_HASH_PASSWORD: z.string().optional(),

  // Spotify (optional)
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  SPOTIFY_REDIRECT_URI: z.string().optional(),

  // AI (optional)
  ANTHROPIC_API_KEY: z.string().optional(),

  // GitHub (optional)
  GH_TOKEN: z.string().optional(),
  GH_USERNAME: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug", "http"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

// Singleton cached env
let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Environment validation failed:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }

  // Production-specific validations
  if (parsed.data.NODE_ENV === "production") {
    if (!parsed.data.ADMIN_HASH_PASSWORD) {
      throw new Error("ADMIN_HASH_PASSWORD is required in production");
    }
    if (parsed.data.ADMIN_PASSWORD) {
      throw new Error("Plain text ADMIN_PASSWORD is forbidden in production");
    }
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

// Helper functions (mirrors backend)
export const isProduction = () => getEnv().NODE_ENV === "production";
export const isDevelopment = () => getEnv().NODE_ENV === "development";
export const isTest = () => getEnv().NODE_ENV === "test";

export const getJWTConfig = () => ({
  secret: getEnv().JWT_SECRET,
  expiresIn: getEnv().JWT_EXPIRES_IN,
  refreshSecret: getEnv().REFRESH_TOKEN,
  refreshExpiresIn: getEnv().REFRESH_TOKEN_EXPIRES_IN,
  issuer: getEnv().JWT_ISSUER,
  audience: getEnv().JWT_AUDIENCE,
});

export const getAdminConfig = () => ({
  email: getEnv().ADMIN_EMAIL,
  password: getEnv().ADMIN_PASSWORD,
  hashedPassword: getEnv().ADMIN_HASH_PASSWORD,
});

export const getSpotifyConfig = () => ({
  clientId: getEnv().SPOTIFY_CLIENT_ID,
  clientSecret: getEnv().SPOTIFY_CLIENT_SECRET,
  redirectUri: getEnv().SPOTIFY_REDIRECT_URI,
});

export const getAIConfig = () => ({
  anthropicKey: getEnv().ANTHROPIC_API_KEY,
});
```

#### 2.4.2 Create Config Index

**File:** `packages/frontend/src/server/config/index.ts`

```typescript
export {
  getEnv,
  isProduction,
  isDevelopment,
  isTest,
  getJWTConfig,
  getAdminConfig,
  getSpotifyConfig,
  getAIConfig,
  type Env,
} from "./env";
```

---

### 2.5 Logger Setup

#### 2.5.1 Create Winston Logger

**File:** `packages/frontend/src/server/utils/logger.ts`

```typescript
import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format
const logFormat = printf(
  ({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    if (stack) {
      msg += `\n${stack}`;
    }

    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
  },
);

// Create logger
const logLevel = process.env.LOG_LEVEL || "info";

export const logger = winston.createLogger({
  level: logLevel,
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat,
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        logFormat,
      ),
    }),
  ],
});

// Specialized loggers (mirrors backend)
export const securityLogger = logger.child({ context: "Security" });
export const authLogger = logger.child({ context: "Auth" });
export const dbLogger = logger.child({ context: "Database" });
export const apiLogger = logger.child({ context: "API" });
export const cacheLogger = logger.child({ context: "Cache" });

// Simple log functions for serverless
export const serverlessLog = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, context ? JSON.stringify(context) : "");
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, context ? JSON.stringify(context) : "");
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, context ? JSON.stringify(context) : "");
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[DEBUG] ${message}`,
        context ? JSON.stringify(context) : "",
      );
    }
  },
};
```

#### 2.5.2 Create Utils Index

**File:** `packages/frontend/src/server/utils/index.ts`

```typescript
export {
  logger,
  securityLogger,
  authLogger,
  dbLogger,
  apiLogger,
  cacheLogger,
  serverlessLog,
} from "./logger";
```

---

## 📦 Package.json Updates

### 2.6 Update Frontend Dependencies

Add these to `packages/frontend/package.json`:

```json
{
  "dependencies": {
    "@prisma/adapter-pg": "^7.2.0",
    "@prisma/client": "^7.2.0",
    "@upstash/redis": "^1.35.8",
    "bcryptjs": "^3.0.3",
    "jsonwebtoken": "^9.0.3",
    "pg": "^8.16.3",
    "winston": "^3.19.0"
  },
  "devDependencies": {
    "prisma": "^7.2.0",
    "@types/bcryptjs": "^3.0.0",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/pg": "^8.16.0"
  }
}
```

---

## ✅ Phase 2 Verification

### Verification Commands

```bash
# 1. Install dependencies
cd packages/frontend
bun install

# 2. Generate Prisma client
bun run prisma:generate

# 3. Test database connection
bun run test:db  # (create test script)

# 4. Test Redis connection
bun run test:redis  # (create test script)

# 5. Run TypeScript check
bun run type-check
```

### Verification Checklist

- [x] `src/server/db/prisma.ts` created and exports `prisma`
- [x] `src/server/redis/client.ts` created and exports `redisService`
- [x] `src/server/config/env.ts` created and validates env
- [x] `src/server/utils/logger.ts` created with Winston
- [x] Prisma schema copied and generates correctly
- [x] All TypeScript imports resolved
- [x] No build errors

---

## ➡️ Next Step

Proceed to **[Phase 3: Service Layer Migration](./phase-3-service-layer.md)**
