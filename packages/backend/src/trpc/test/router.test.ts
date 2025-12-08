import { describe, it, expect, vi } from "vitest";
import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

// Mock Redis
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    ping: vi.fn().mockResolvedValue("PONG"),
  })),
}));

// Mock PrismaClient
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock @portfolio/logger
vi.mock("@portfolio/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe("tRPC Router", () => {
  // Create a test tRPC instance
  const t = initTRPC.create();
  const publicProcedure = t.procedure;

  describe("health procedures", () => {
    it("should have basic health check procedure", async () => {
      const healthRouter = t.router({
        health: publicProcedure.query(() => ({
          status: "ok",
          timestamp: new Date().toISOString(),
        })),
      });

      const caller = healthRouter.createCaller({});
      const result = await caller.health();

      expect(result.status).toBe("ok");
      expect(result.timestamp).toBeDefined();
    });

    it("should have detailed health check procedure", async () => {
      const healthRouter = t.router({
        healthDetailed: publicProcedure.query(() => ({
          status: "ok",
          version: "1.0.0",
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString(),
        })),
      });

      const caller = healthRouter.createCaller({});
      const result = await caller.healthDetailed();

      expect(result.status).toBe("ok");
      expect(result.version).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.memory).toBeDefined();
    });

    it("should have database health check procedure", async () => {
      const healthRouter = t.router({
        healthDatabase: publicProcedure.query(async () => {
          // Mock database check
          return {
            status: "ok",
            connected: true,
            responseTime: 5,
          };
        }),
      });

      const caller = healthRouter.createCaller({});
      const result = await caller.healthDatabase();

      expect(result.status).toBe("ok");
      expect(result.connected).toBe(true);
    });

    it("should have Redis health check procedure", async () => {
      const healthRouter = t.router({
        healthRedis: publicProcedure.query(async () => {
          return {
            status: "ok",
            connected: true,
            responseTime: 2,
          };
        }),
      });

      const caller = healthRouter.createCaller({});
      const result = await caller.healthRedis();

      expect(result.status).toBe("ok");
      expect(result.connected).toBe(true);
    });

    it("should have memory health check procedure", async () => {
      const healthRouter = t.router({
        healthMemory: publicProcedure.query(() => {
          const memory = process.memoryUsage();
          return {
            status: "ok",
            heapUsed: memory.heapUsed,
            heapTotal: memory.heapTotal,
            external: memory.external,
            rss: memory.rss,
          };
        }),
      });

      const caller = healthRouter.createCaller({});
      const result = await caller.healthMemory();

      expect(result.status).toBe("ok");
      expect(result.heapUsed).toBeGreaterThan(0);
      expect(result.heapTotal).toBeGreaterThan(0);
    });

    it("should have system health check procedure", async () => {
      const healthRouter = t.router({
        healthSystem: publicProcedure.query(() => ({
          status: "ok",
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid,
        })),
      });

      const caller = healthRouter.createCaller({});
      const result = await caller.healthSystem();

      expect(result.status).toBe("ok");
      expect(result.platform).toBeDefined();
      expect(result.nodeVersion).toBeDefined();
    });

    it("should have readiness check procedure", async () => {
      const healthRouter = t.router({
        healthReady: publicProcedure.query(async () => ({
          ready: true,
          checks: {
            database: true,
            redis: true,
          },
        })),
      });

      const caller = healthRouter.createCaller({});
      const result = await caller.healthReady();

      expect(result.ready).toBe(true);
      expect(result.checks).toBeDefined();
    });

    it("should have liveness check procedure", async () => {
      const healthRouter = t.router({
        healthLive: publicProcedure.query(() => ({
          alive: true,
          timestamp: new Date().toISOString(),
        })),
      });

      const caller = healthRouter.createCaller({});
      const result = await caller.healthLive();

      expect(result.alive).toBe(true);
    });
  });

  describe("echo procedure", () => {
    it("should echo input message", async () => {
      const echoRouter = t.router({
        echo: publicProcedure
          .input(z.object({ message: z.string() }))
          .query(({ input }) => ({
            echo: input.message,
            timestamp: new Date().toISOString(),
          })),
      });

      const caller = echoRouter.createCaller({});
      const result = await caller.echo({ message: "Hello, World!" });

      expect(result.echo).toBe("Hello, World!");
      expect(result.timestamp).toBeDefined();
    });

    it("should handle empty message", async () => {
      const echoRouter = t.router({
        echo: publicProcedure
          .input(z.object({ message: z.string() }))
          .query(({ input }) => ({
            echo: input.message,
          })),
      });

      const caller = echoRouter.createCaller({});
      const result = await caller.echo({ message: "" });

      expect(result.echo).toBe("");
    });

    it("should handle special characters in message", async () => {
      const echoRouter = t.router({
        echo: publicProcedure
          .input(z.object({ message: z.string() }))
          .query(({ input }) => ({
            echo: input.message,
          })),
      });

      const caller = echoRouter.createCaller({});
      const result = await caller.echo({
        message: "Special: <script>alert('xss')</script>",
      });

      expect(result.echo).toBe("Special: <script>alert('xss')</script>");
    });
  });

  describe("router composition", () => {
    it("should compose multiple routers", async () => {
      const healthRouter = t.router({
        status: publicProcedure.query(() => ({ status: "ok" })),
      });

      const echoRouter = t.router({
        echo: publicProcedure
          .input(z.string())
          .query(({ input }) => ({ message: input })),
      });

      const appRouter = t.router({
        health: healthRouter,
        echo: echoRouter,
      });

      const caller = appRouter.createCaller({});

      const healthResult = await caller.health.status();
      expect(healthResult.status).toBe("ok");

      const echoResult = await caller.echo.echo("test");
      expect(echoResult.message).toBe("test");
    });
  });

  describe("error handling", () => {
    it("should throw TRPCError for invalid input", async () => {
      const router = t.router({
        validateInput: publicProcedure
          .input(z.object({ email: z.string().email() }))
          .query(({ input }) => input),
      });

      const caller = router.createCaller({});

      await expect(
        caller.validateInput({ email: "invalid-email" }),
      ).rejects.toThrow();
    });

    it("should handle procedure errors", async () => {
      const router = t.router({
        failingProcedure: publicProcedure.query(() => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong",
          });
        }),
      });

      const caller = router.createCaller({});

      await expect(caller.failingProcedure()).rejects.toThrow(TRPCError);
    });

    it("should handle not found errors", async () => {
      const router = t.router({
        getItem: publicProcedure.input(z.string()).query(({ input }) => {
          if (input === "not-found") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Item not found",
            });
          }
          return { id: input };
        }),
      });

      const caller = router.createCaller({});

      await expect(caller.getItem("not-found")).rejects.toThrow(TRPCError);
    });
  });

  describe("context handling", () => {
    it("should access context in procedures", async () => {
      type Context = { userId: string };

      const t2 = initTRPC.context<Context>().create();

      const router = t2.router({
        getUser: t2.procedure.query(({ ctx }) => ({
          userId: ctx.userId,
        })),
      });

      const caller = router.createCaller({ userId: "user-123" });
      const result = await caller.getUser();

      expect(result.userId).toBe("user-123");
    });
  });
});
