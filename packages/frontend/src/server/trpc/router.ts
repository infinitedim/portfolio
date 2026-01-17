import { router, publicProcedure } from "./init";
import { z } from "zod";
import { authRouter } from "./routers/auth";
import { projectsRouter } from "./routers/projects";
import { spotifyRouter } from "./routers/spotify";
import { securityRouter } from "./routers/security";
import { healthRouter } from "./routers/health";

export const appRouter = router({
  // Health endpoints
  health: publicProcedure.query(async ({ ctx }) => {
    try {
      const cached = await ctx.services.redis.get<{ status: string }>(
        "api:health",
      );
      if (cached) return cached;

      const payload = { status: "ok" } as const;
      await ctx.services.redis.set("api:health", payload, 5);
      return payload;
    } catch {
      return { status: "ok" } as const;
    }
  }),

  healthDetailed: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.health.checkHealth();
  }),

  // Echo for testing
  echo: publicProcedure
    .input(z.object({ msg: z.string() }))
    .query(({ input }) => input),

  // Sub-routers
  auth: authRouter,
  projects: projectsRouter,
  spotify: spotifyRouter,
  security: securityRouter,
  healthCheck: healthRouter,
});

export type AppRouter = typeof appRouter;

