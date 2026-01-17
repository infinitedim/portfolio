import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../init";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const authRouter = router({
  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    // Get client IP from headers
    const forwarded = ctx.headers.get("x-forwarded-for");
    const clientIp = forwarded?.split(",")[0]?.trim() || "unknown";
    const userAgent = ctx.headers.get("user-agent") || undefined;

    // Check rate limit
    const rateLimit = await ctx.services.security.checkRateLimit(
      clientIp,
      "login",
    );
    if (rateLimit.isBlocked) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: rateLimit.message || "Too many login attempts",
      });
    }

    try {
      const result = await ctx.services.auth.validateCredentials(
        input.email,
        input.password,
        clientIp,
        userAgent,
      );

      return {
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: error instanceof Error ? error.message : "Login failed",
      });
    }
  }),

  logout: protectedProcedure
    .input(z.object({ refreshToken: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const authHeader = ctx.headers.get("authorization");
      const accessToken = authHeader?.slice(7) || "";

      const forwarded = ctx.headers.get("x-forwarded-for");
      const clientIp = forwarded?.split(",")[0]?.trim() || "unknown";
      const userAgent = ctx.headers.get("user-agent") || undefined;

      await ctx.services.auth.logout(
        accessToken,
        clientIp,
        userAgent,
        input.refreshToken,
      );

      return { success: true };
    }),

  refresh: publicProcedure
    .input(refreshSchema)
    .mutation(async ({ ctx, input }) => {
      const forwarded = ctx.headers.get("x-forwarded-for");
      const clientIp = forwarded?.split(",")[0]?.trim() || "unknown";

      try {
        const tokens = await ctx.services.auth.refreshAccessToken(
          input.refreshToken,
          clientIp,
        );

        return {
          success: true,
          ...tokens,
        };
      } catch (error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Token refresh failed",
        });
      }
    }),

  validate: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const user = await ctx.services.auth.validateToken(input.token);
        return { valid: true, user };
      } catch {
        return { valid: false, user: null };
      }
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.user,
    };
  }),
});

