/**
 * Serverless-compatible tRPC router for Next.js API routes
 * This router is designed to work without NestJS dependencies
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import { Redis } from "@upstash/redis";
import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

let prismaClient: PrismaClient | null = null;
let redisClient: Redis | null = null;
let redisAvailable = true;

const serverlessLog = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(
      `[serverless] ${message}`,
      context ? JSON.stringify(context) : "",
    );
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(
      `[serverless] ${message}`,
      context ? JSON.stringify(context) : "",
    );
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(
      `[serverless] ${message}`,
      context ? JSON.stringify(context) : "",
    );
  },
};

/**
 * Gets or creates a singleton Prisma client instance
 * Lazy initialization ensures client is only created when needed
 * @returns Prisma client instance
 */
function getPrisma(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      log:
        process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
    serverlessLog.info("Prisma client initialized");
  }
  return prismaClient;
}

/**
 * Gets or creates a Redis client instance for caching
 * Returns null if Redis is unavailable or not configured
 * @returns Redis client instance or null
 */
function getRedis(): Redis | null {
  if (!redisAvailable) {
    return null;
  }

  if (!redisClient && process.env.UPSTASH_REDIS_REST_URL) {
    try {
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
      });
      serverlessLog.info("Redis client initialized");
    } catch (error) {
      serverlessLog.error("Failed to initialize Redis client", {
        error: error instanceof Error ? error.message : String(error),
      });
      redisAvailable = false;
      return null;
    }
  }
  return redisClient;
}

interface RateLimitEntry {
  timestamp: number;
  windowMs: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_CLEANUP_INTERVAL = 60000;
const MAX_RATE_LIMIT_ENTRIES = 10000;
let lastCleanup = Date.now();

/**
 * Clears the in-memory rate limit map
 * Useful for testing or manual cleanup
 */
export function clearRateLimitMap() {
  rateLimitMap.clear();
}

function cleanupRateLimitMap() {
  const now = Date.now();

  if (now - lastCleanup < RATE_LIMIT_CLEANUP_INTERVAL) {
    return;
  }

  lastCleanup = now;
  let cleanedCount = 0;

  for (const [key, entry] of rateLimitMap.entries()) {
    if (now - entry.timestamp > entry.windowMs) {
      rateLimitMap.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    serverlessLog.info("Rate limit map cleanup", {
      cleaned: cleanedCount,
      remaining: rateLimitMap.size,
    });
  }

  if (rateLimitMap.size > MAX_RATE_LIMIT_ENTRIES) {
    const entriesToDelete = rateLimitMap.size - MAX_RATE_LIMIT_ENTRIES;
    const sortedEntries = [...rateLimitMap.entries()].sort(
      (a, b) => a[1].timestamp - b[1].timestamp,
    );

    for (let i = 0; i < entriesToDelete; i++) {
      rateLimitMap.delete(sortedEntries[i][0]);
    }

    serverlessLog.warn("Rate limit map emergency cleanup", {
      deleted: entriesToDelete,
      remaining: rateLimitMap.size,
    });
  }
}

async function checkRateLimit(
  key: string,
  windowMs: number = 60000,
): Promise<boolean> {
  const redis = getRedis();

  if (redis) {
    try {
      const exists = await redis.get<string>(`ratelimit:${key}`);
      if (exists) return false;
      await redis.set(`ratelimit:${key}`, "1", {
        ex: Math.floor(windowMs / 1000),
      });
      return true;
    } catch (error) {
      serverlessLog.warn("Redis rate limit failed, using in-memory fallback", {
        error: error instanceof Error ? error.message : String(error),
        key,
      });
    }
  }

  cleanupRateLimitMap();

  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (entry && now - entry.timestamp < entry.windowMs) {
    return false;
  }

  rateLimitMap.set(key, { timestamp: now, windowMs });
  return true;
}

const healthRouter = router({
  check: publicProcedure.query(async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  }),

  detailed: publicProcedure.query(async () => {
    const checks: Record<string, { status: string; error?: string }> = {};

    try {
      await getPrisma().$queryRaw`SELECT 1`;
      checks.database = { status: "healthy" };
    } catch (error) {
      checks.database = {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    try {
      const redis = getRedis();
      if (redis) {
        await redis.ping();
        checks.redis = { status: "healthy" };
      } else {
        checks.redis = { status: "not configured" };
      }
    } catch (error) {
      checks.redis = {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    const allHealthy = Object.values(checks).every(
      (c) => c.status === "healthy" || c.status === "not configured",
    );

    return {
      status: allHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      checks,
    };
  }),
});

interface AuthUser {
  userId: string;
  email: string;
  role: "admin";
}

const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(
      async ({
        input,
      }): Promise<
        | {
            success: true;
            user: AuthUser;
            accessToken: string;
            refreshToken: string;
          }
        | { success: false; error: string }
      > => {
        const allowed = await checkRateLimit(`login:${input.email}`);
        if (!allowed) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many login attempts",
          });
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
          return {
            success: false,
            error: "Admin credentials not configured",
          };
        }

        const emailBuffer = Buffer.from(input.email.padEnd(256, "\0"));
        const adminEmailBuffer = Buffer.from(adminEmail.padEnd(256, "\0"));
        const emailMatch =
          emailBuffer.length === adminEmailBuffer.length &&
          createHash("sha256").update(emailBuffer).digest("hex") ===
            createHash("sha256").update(adminEmailBuffer).digest("hex");

        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
        let passwordMatch = false;

        if (adminPasswordHash) {
          passwordMatch = await bcrypt.compare(
            input.password,
            adminPasswordHash,
          );
        } else if (process.env.NODE_ENV !== "production") {
          const devHash = await bcrypt.hash(adminPassword, 10);
          passwordMatch = await bcrypt.compare(input.password, devHash);
        }

        if (!emailMatch || !passwordMatch) {
          return {
            success: false,
            error: "Invalid credentials",
          };
        }

        const accessToken = randomBytes(32).toString("hex");
        const refreshToken = randomBytes(32).toString("hex");

        const redis = getRedis();
        if (redis) {
          await redis.set(`token:${accessToken}`, input.email, { ex: 3600 });
          await redis.set(`refresh:${refreshToken}`, input.email, {
            ex: 86400 * 7,
          });
        }

        return {
          success: true,
          user: {
            userId: "admin-1",
            email: input.email,
            role: "admin",
          },
          accessToken,
          refreshToken,
        };
      },
    ),

  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(
      async ({
        input,
      }): Promise<
        | { success: true; accessToken: string; refreshToken: string }
        | { success: false; error: string }
      > => {
        const redis = getRedis();
        if (!redis) {
          return {
            success: false,
            error: "Token refresh not available",
          };
        }

        const email = await redis.get<string>(`refresh:${input.refreshToken}`);
        if (!email) {
          return {
            success: false,
            error: "Invalid refresh token",
          };
        }

        const accessToken = randomBytes(32).toString("hex");
        const refreshToken = randomBytes(32).toString("hex");

        await redis.set(`token:${accessToken}`, email, { ex: 3600 });
        await redis.set(`refresh:${refreshToken}`, email, { ex: 86400 * 7 });
        await redis.del(`refresh:${input.refreshToken}`);

        return {
          success: true,
          accessToken,
          refreshToken,
        };
      },
    ),

  logout: publicProcedure
    .input(z.object({ accessToken: z.string() }))
    .mutation(async ({ input }): Promise<{ success: true }> => {
      const redis = getRedis();
      if (redis) {
        await redis.del(`token:${input.accessToken}`);
      }
      return { success: true };
    }),

  validate: publicProcedure
    .input(z.object({ accessToken: z.string() }))
    .mutation(
      async ({
        input,
      }): Promise<
        { success: true; user: AuthUser } | { success: false; error: string }
      > => {
        const redis = getRedis();
        if (!redis) {
          return {
            success: false,
            error: "Token validation not available",
          };
        }

        const email = await redis.get<string>(`token:${input.accessToken}`);
        if (!email) {
          return {
            success: false,
            error: "Invalid or expired token",
          };
        }

        return {
          success: true,
          user: {
            userId: "admin-1",
            email,
            role: "admin",
          },
        };
      },
    ),
});

const spotifyRouter = router({
  nowPlaying: publicProcedure.query(async () => {
    return { isPlaying: false };
  }),
});

const securityRouter = router({
  validateInput: publicProcedure
    .input(z.object({ input: z.string() }))
    .mutation(({ input }) => {
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+=/i,
        /SELECT.*FROM/i,
        /INSERT.*INTO/i,
        /UPDATE.*SET/i,
        /DELETE.*FROM/i,
        /DROP.*TABLE/i,
        /--/,
        /;.*SELECT/i,
      ];

      const hasDangerousContent = dangerousPatterns.some((pattern) =>
        pattern.test(input.input),
      );

      return {
        isValid: !hasDangerousContent,
        sanitizedInput: input.input.replace(/<[^>]*>/g, ""),
        riskLevel: hasDangerousContent ? "high" : "low",
      };
    }),

  checkRateLimit: publicProcedure
    .input(z.object({ key: z.string(), type: z.string() }))
    .mutation(async ({ input }) => {
      const allowed = await checkRateLimit(`${input.type}:${input.key}`);
      return { allowed, remaining: allowed ? 1 : 0 };
    }),
});

const projectsRouter = router({
  get: publicProcedure
    .input(
      z
        .object({
          section: z.string().optional(),
          limit: z.number().int().positive().max(100).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      try {
        const prisma = getPrisma();

        const projects = await prisma.project.findMany({
          take: input?.limit ?? 20,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            tech: true,
            featured: true,
            status: true,
            url: true,
            githubUrl: true,
            imageUrl: true,
            createdAt: true,
          },
        });

        return { data: projects, meta: { section: input?.section } };
      } catch {
        return { data: [], meta: { section: input?.section } };
      }
    }),
});

export const appRouter = router({
  health: healthRouter.check,
  healthDetailed: healthRouter.detailed,
  auth: authRouter,
  spotify: spotifyRouter,
  security: securityRouter,
  projects: projectsRouter,
  echo: publicProcedure
    .input(z.object({ msg: z.string() }))
    .query(({ input }) => input),
});

export type AppRouter = typeof appRouter;
