import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import { router, publicProcedure } from "./procedures";
import { z } from "zod";
import { authRouter } from "./auth.router";
import { projectsRouter } from "./projects.router";
import { spotifyRouter } from "./spotify.router";
import { securityRouter } from "./security.router";
import { createBackendContext } from "./context";

export const appRouter = router({
  health: publicProcedure.query(async ({ ctx }) => {
    try {
      const cached = await ctx.services.redis.get<{ status: string }>(
        "api:health",
      );
      if (cached) return cached;
      const payload = { status: "ok" } as const;
      await ctx.services.redis.set("api:health", payload, 5); // 5s burst cache
      return payload;
    } catch {
      return { status: "ok" } as const;
    }
  }),

  healthDetailed: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.health.getDetailedHealth();
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  healthDatabase: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.services.health.checkHealth();
      return {
        status: result.checks.database.status,
        responseTime: result.checks.database.responseTime,
        details: result.checks.database.details,
        error: result.checks.database.error,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  healthRedis: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.services.health.checkHealth();
      return {
        status: result.checks.redis.status,
        responseTime: result.checks.redis.responseTime,
        details: result.checks.redis.details,
        error: result.checks.redis.error,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  healthMemory: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.services.health.checkHealth();
      return {
        status: result.checks.memory.status,
        responseTime: result.checks.memory.responseTime,
        details: result.checks.memory.details,
        error: result.checks.memory.error,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  healthSystem: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.services.health.checkHealth();
      return {
        status: result.checks.system.status,
        responseTime: result.checks.system.responseTime,
        details: result.checks.system.details,
        error: result.checks.system.error,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  healthReady: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.services.health.checkHealth();

      const isReady =
        result.checks.database.status === "healthy" &&
        result.checks.redis.status === "healthy";

      if (!isReady) {
        return {
          status: "not ready",
          timestamp: result.timestamp,
          reason: "Database or Redis is not healthy",
          checks: {
            database: result.checks.database.status,
            redis: result.checks.redis.status,
          },
        };
      }

      return {
        status: "ready",
        timestamp: result.timestamp,
        uptime: result.uptime,
      };
    } catch (error) {
      return {
        status: "not ready",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  healthLive: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.services.health.checkHealth();

      const isAlive = result.status !== "unhealthy";

      if (!isAlive) {
        return {
          status: "not alive",
          timestamp: result.timestamp,
          reason: "Service is unhealthy",
          overallStatus: result.status,
        };
      }

      return {
        status: "alive",
        timestamp: result.timestamp,
        uptime: result.uptime,
        overallStatus: result.status,
      };
    } catch (error) {
      return {
        status: "not alive",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  echo: publicProcedure
    .input(z.object({ msg: z.string() }))
    .query(({ input }) => input),
  auth: authRouter,
  projects: projectsRouter,
  spotify: spotifyRouter,
  security: securityRouter,
});

export type AppRouter = typeof appRouter;

/**
 *
 * @param {express.Express} app - The Express app to mount the TRPC server on
 * @description Mounts the TRPC server on the given Express app
 */
export function mountTrpc(app: express.Express): void {
  app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: createBackendContext,
    }),
  );
}
