import { z } from "zod";
import { router, publicProcedure } from "./procedures";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context";
import { securityLogger } from "../logging/logger";

/**
 * Enforce 1 login request per minute per IP using context services.
 * Uses Redis with in-memory fallback.
 */
async function assertLoginRate(ctx: TrpcContext): Promise<void> {
  const ip = ctx.clientIp;

  try {
    const key = `auth:login:${ip}`;
    const exists = await ctx.services.redis.get<string>(key);
    if (exists) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded",
      });
    }
    await ctx.services.redis.set(key, "1", 60); // 1/min
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    // Redis failed, use in-memory fallback via security service
    const rateLimitResult = await ctx.services.security.checkRateLimit(
      ip,
      "login",
    );
    if (rateLimitResult.isBlocked) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: rateLimitResult.message || "Rate limit exceeded",
      });
    }
  }
}

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;
      await assertLoginRate(typedCtx);

      try {
        const result = await typedCtx.services.auth.validateCredentials(
          input.email,
          input.password,
          typedCtx.clientIp,
          typedCtx.req,
        );

        return {
          success: true,
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        } as const;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Authentication failed",
        } as const;
      }
    }),

  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;

      try {
        const result = await typedCtx.services.auth.refreshToken(
          input.refreshToken,
          typedCtx.clientIp,
          typedCtx.req,
        );

        return {
          success: true,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        } as const;
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Token refresh failed",
        } as const;
      }
    }),

  logout: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        refreshToken: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;

      try {
        await typedCtx.services.auth.logout(
          input.accessToken,
          typedCtx.clientIp,
          typedCtx.req,
          input.refreshToken,
        );

        return { success: true } as const;
      } catch (error) {
        securityLogger.error("Logout error (non-critical)", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          component: "AuthRouter",
          operation: "logout",
        });
        // Logout should always succeed, even if there's an error
        return { success: true } as const;
      }
    }),

  validate: publicProcedure
    .input(z.object({ accessToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;

      try {
        const user = await typedCtx.services.auth.validateToken(
          input.accessToken,
          typedCtx.req,
        );

        return {
          success: true,
          user,
        } as const;
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Token validation failed",
        } as const;
      }
    }),

  // Spotify OAuth login
  spotifyLogin: publicProcedure
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as TrpcContext;
      await assertLoginRate(typedCtx);

      try {
        const { code } = input;

        // Exchange code for tokens
        const tokenResponse = await fetch(
          "https://accounts.spotify.com/api/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(
                `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
              ).toString("base64")}`,
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code,
              redirect_uri: process.env.SPOTIFY_REDIRECT_URI || "",
            }),
          },
        );

        if (!tokenResponse.ok) {
          return {
            success: false,
            error: "Failed to exchange authorization code for tokens",
          } as const;
        }

        const tokenData = (await tokenResponse.json()) as {
          access_token: string;
          refresh_token: string;
          expires_in: number;
        };

        return {
          success: true,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
        } as const;
      } catch {
        return {
          success: false,
          error: "Spotify authentication failed",
        } as const;
      }
    }),
});
