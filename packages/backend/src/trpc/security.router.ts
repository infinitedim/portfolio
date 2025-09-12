import { router, publicProcedure } from "@portfolio/trpc";
import { z } from "zod";
import { SecurityService } from "../security/security.service";
import { RedisService } from "../redis/redis.service";

// Create security service instance
const securityService = new SecurityService(new RedisService());

export const securityRouter = router({
  // Input validation
  validateInput: publicProcedure
    .input(
      z.object({
        input: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = securityService.validateCommand(input.input);
      return {
        isValid: result.isValid,
        sanitizedInput: result.sanitized,
        error: result.error,
        riskLevel: result.riskLevel,
      };
    }),

  // Rate limiting
  checkRateLimit: publicProcedure
    .input(
      z.object({
        key: z.string(),
        type: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return await securityService.checkRateLimit(input.key, input.type);
    }),

  getRateLimitInfo: publicProcedure
    .input(
      z.object({
        key: z.string(),
        type: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return await securityService.getRateLimitInfo(input.key, input.type);
    }),

  resetRateLimit: publicProcedure
    .input(
      z.object({
        key: z.string(),
        type: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await securityService.resetRateLimit(input.key, input.type);
      return { success: true };
    }),

  // Security metrics
  getRateLimitStats: publicProcedure.query(async () => {
    return await securityService.getRateLimitStats();
  }),

  getBlockedKeys: publicProcedure
    .input(
      z.object({
        pattern: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      return await securityService.getBlockedKeys(input.pattern);
    }),

  unblockKey: publicProcedure
    .input(
      z.object({
        key: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await securityService.unblockKey(input.key);
      return { success: true };
    }),

  // Input sanitization
  sanitizeText: publicProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return securityService.sanitizeText(input.text);
    }),

  // Security checks
  hasSqlInjectionPatterns: publicProcedure
    .input(
      z.object({
        input: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return securityService.hasSqlInjectionPatterns(input.input);
    }),

  hasXssPatterns: publicProcedure
    .input(
      z.object({
        input: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return securityService.hasXssPatterns(input.input);
    }),

  // Token generation
  generateSecureToken: publicProcedure
    .input(
      z.object({
        length: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return securityService.generateSecureToken(input.length);
    }),

  // Validation schemas
  validateEmail: publicProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const validated = securityService.validateEmail(input.email);
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
    .mutation(async ({ input }) => {
      try {
        const validated = securityService.validatePassword(input.password);
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
    .mutation(async ({ input }) => {
      try {
        const validated = securityService.validateUsername(input.username);
        return { isValid: true, username: validated };
      } catch (error) {
        return {
          isValid: false,
          error: error instanceof Error ? error.message : "Invalid username",
        };
      }
    }),

  // Security recommendations
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
