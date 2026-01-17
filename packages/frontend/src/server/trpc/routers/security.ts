import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../init";

export const securityRouter = router({
  validateInput: publicProcedure
    .input(
      z.object({
        input: z.string(),
        maxLength: z.number().optional(),
        allowHtml: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.services.security.validateInput(input.input, {
        maxLength: input.maxLength,
        allowHtml: input.allowHtml,
      });
    }),

  checkRateLimit: publicProcedure
    .input(
      z.object({
        key: z.string(),
        type: z.enum(["login", "api", "aiChat"]).default("api"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.security.checkRateLimit(
        input.key,
        input.type,
      );
      return {
        allowed: !result.isBlocked,
        remaining: result.remaining,
        resetTime: result.resetTime,
      };
    }),

  getCSRFToken: protectedProcedure.query(async ({ ctx }) => {
    const token = ctx.services.security.generateCSRFToken();

    // Store token with session (use user ID as session ID for simplicity)
    if (ctx.user) {
      await ctx.services.security.storeCSRFToken(ctx.user.userId, token, 3600);
    }

    return { token };
  }),

  getSecurityHeaders: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.security.getSecurityHeaders();
  }),
});

