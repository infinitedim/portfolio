import { router, publicProcedure } from "../init";

export const healthRouter = router({
  ping: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.health.ping();
  }),

  check: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.health.checkHealth();
  }),

  database: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.health.checkDatabase();
  }),

  redis: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.health.checkRedis();
  }),

  memory: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.health.checkMemory();
  }),
});

