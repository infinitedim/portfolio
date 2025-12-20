import { router, publicProcedure } from "./procedures";
import { z } from "zod";
import type { TrpcContext } from "./context";

export const securityRouter = router({
  getCsrfToken: publicProcedure.query(async ({ ctx }) => {
    const typedCtx = ctx as TrpcContext;
    const sessionId = typedCtx.services.csrf.getSessionId(typedCtx.req);
    const token = await typedCtx.services.csrf.generateToken(sessionId);
    return {
      token: token.token,
      expiresAt: token.expiresAt,
    };
  }),

  validateInput: publicProcedure
    .input(
      z.object({
        input: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;
      const result = typedCtx.services.security.validateCommand(input.input);
      return {
        isValid: result.isValid,
        sanitizedInput: result.sanitized,
        error: result.error,
        riskLevel: result.riskLevel,
      };
    }),

  checkRateLimit: publicProcedure
    .input(
      z.object({
        key: z.string(),
        type: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;
      return await typedCtx.services.security.checkRateLimit(
        input.key,
        input.type,
      );
    }),

  getRateLimitInfo: publicProcedure
    .input(
      z.object({
        key: z.string(),
        type: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;
      return await typedCtx.services.security.getRateLimitInfo(
        input.key,
        input.type,
      );
    }),

  resetRateLimit: publicProcedure
    .input(
      z.object({
        key: z.string(),
        type: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;
      await typedCtx.services.security.resetRateLimit(input.key, input.type);
      return { success: true };
    }),

  getRateLimitStats: publicProcedure.query(async ({ ctx }) => {
    const typedCtx = ctx as TrpcContext;
    return await typedCtx.services.security.getRateLimitStats();
  }),

  getBlockedKeys: publicProcedure
    .input(
      z.object({
        pattern: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;
      return await typedCtx.services.security.getBlockedKeys(input.pattern);
    }),

  unblockKey: publicProcedure
    .input(
      z.object({
        key: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;
      await typedCtx.services.security.unblockKey(input.key);
      return { success: true };
    }),

  sanitizeText: publicProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;
      return typedCtx.services.security.sanitizeText(input.text);
    }),

  hasSqlInjectionPatterns: publicProcedure
    .input(
      z.object({
        input: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;
      return typedCtx.services.security.hasSqlInjectionPatterns(input.input);
    }),

  hasXssPatterns: publicProcedure
    .input(
      z.object({
        input: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;
      return typedCtx.services.security.hasXssPatterns(input.input);
    }),

  generateSecureToken: publicProcedure
    .input(
      z.object({
        length: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;
      return typedCtx.services.security.generateSecureToken(input.length);
    }),

  validateEmail: publicProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;
      try {
        const validated = typedCtx.services.security.validateEmail(input.email);
        return { isValid: true, email: validated };
      } catch (error) {
        return {
          isValid: false,
          error: error instanceof Error ? error.message : "Invalid email",
        };
      }
    }),

  validatePassword: publicProcedure
    .input(
      z.object({
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;
      try {
        const validated = typedCtx.services.security.validatePassword(
          input.password,
        );
        return { isValid: true, password: validated };
      } catch (error) {
        return {
          isValid: false,
          error: error instanceof Error ? error.message : "Invalid password",
        };
      }
    }),

  validateUsername: publicProcedure
    .input(
      z.object({
        username: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;
      try {
        const validated = typedCtx.services.security.validateUsername(
          input.username,
        );
        return { isValid: true, username: validated };
      } catch (error) {
        return {
          isValid: false,
          error: error instanceof Error ? error.message : "Invalid username",
        };
      }
    }),

  getSecurityRecommendations: publicProcedure
    .input(
      z.object({
        metrics: z.object({
          totalRequests: z.number(),
          validRequests: z.number(),
          blockedRequests: z.number(),
          averageRequestsPerMinute: z.number(),
        }),
        securityState: z.object({
          isRateLimited: z.boolean(),
          suspiciousActivity: z.number(),
          blockedAttempts: z.number(),
        }),
      }),
    )
    .query(async ({ input }) => {
      const recommendations: string[] = [];

      if (input.securityState.isRateLimited) {
        recommendations.push(
          "Rate limiting is active. Wait a moment before trying again.",
        );
      }

      if (input.securityState.suspiciousActivity > 5) {
        recommendations.push(
          "High suspicious activity detected. Consider clearing session.",
        );
      }

      if (input.metrics.blockedRequests > input.metrics.validRequests) {
        recommendations.push(
          "Many requests are being blocked. Check your input format.",
        );
      }

      if (input.metrics.averageRequestsPerMinute > 20) {
        recommendations.push(
          "High request frequency detected. Consider slowing down.",
        );
      }

      return recommendations;
    }),
});
