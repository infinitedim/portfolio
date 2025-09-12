import { z } from "zod";
import { router, publicProcedure } from "@portfolio/trpc";
import { AuthService } from "../auth/auth.service";
import { TRPCError } from "@trpc/server";
import type express from "express";
import { RedisService } from "../redis/redis.service";
import { SecurityService } from "../security/security.service";
import { AuditLogService } from "../security/audit-log.service";
import { PrismaService } from "../prisma/prisma.service";

// Simple in-memory IP-based limiter: 1 request per minute
const loginRateMap = new Map<string, number>();
/**
 * Enforce 1 login request per minute per IP
 * @param {express.Request | unknown} ctx - The context object
 */
async function assertLoginRate(
  ctx: { req?: express.Request } | unknown,
): Promise<void> {
  const req = (ctx as { req?: express.Request }).req;
  const xf = (req?.headers?.["x-forwarded-for"] as string) || "";
  const realIp = (req && (req as unknown as { ip?: string }).ip) || "";
  const ip = xf.split(",")[0]?.trim() || realIp || "unknown";

  try {
    const redis = new RedisService();
    const key = `auth:login:${ip}`;
    const exists = await redis.get<string>(key);
    if (exists) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded",
      });
    }
    await redis.set(key, "1", 60); // 1/min
    return;
  } catch {
    const now = Date.now();
    const last = loginRateMap.get(ip) ?? 0;
    if (now - last < 60_000) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded",
      });
    }
    loginRateMap.set(ip, now);
  }
}

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      await assertLoginRate(ctx);

      const securityService = new SecurityService(new RedisService());
      const auditLogService = new AuditLogService(
        new PrismaService(),
        new RedisService(),
      );
      const auth = new AuthService(securityService, auditLogService);

      try {
        // Get client IP from request context
        const req = (ctx as { req?: express.Request }).req;
        const xf = (req?.headers?.["x-forwarded-for"] as string) || "";
        const realIp = (req && (req as unknown as { ip?: string }).ip) || "";
        const clientIp = xf.split(",")[0]?.trim() || realIp || "unknown";

        const result = await auth.validateCredentials(
          input.email,
          input.password,
          clientIp,
          req,
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
      const securityService = new SecurityService(new RedisService());
      const auditLogService = new AuditLogService(
        new PrismaService(),
        new RedisService(),
      );
      const auth = new AuthService(securityService, auditLogService);

      try {
        // Get client IP from request context
        const req = (ctx as { req?: express.Request }).req;
        const xf = (req?.headers?.["x-forwarded-for"] as string) || "";
        const realIp = (req && (req as unknown as { ip?: string }).ip) || "";
        const clientIp = xf.split(",")[0]?.trim() || realIp || "unknown";

        const result = await auth.refreshToken(
          input.refreshToken,
          clientIp,
          req,
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
    .input(z.object({ accessToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const securityService = new SecurityService(new RedisService());
      const auditLogService = new AuditLogService(
        new PrismaService(),
        new RedisService(),
      );
      const auth = new AuthService(securityService, auditLogService);

      try {
        // Get client IP from request context
        const req = (ctx as { req?: express.Request }).req;
        const xf = (req?.headers?.["x-forwarded-for"] as string) || "";
        const realIp = (req && (req as unknown as { ip?: string }).ip) || "";
        const clientIp = xf.split(",")[0]?.trim() || realIp || "unknown";

        await auth.logout(input.accessToken, clientIp, req);

        return { success: true } as const;
      } catch (error) {
        console.error(error);
        // Logout should always succeed, even if there's an error
        return { success: true } as const;
      }
    }),

  validate: publicProcedure
    .input(z.object({ accessToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const securityService = new SecurityService(new RedisService());
      const auditLogService = new AuditLogService(
        new PrismaService(),
        new RedisService(),
      );
      const auth = new AuthService(securityService, auditLogService);

      try {
        const req = (ctx as { req?: express.Request }).req;
        const user = await auth.validateToken(input.accessToken, req);

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
      await assertLoginRate(ctx);

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

        const tokenData = await tokenResponse.json();

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
