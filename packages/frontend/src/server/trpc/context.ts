import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { authService, type AuthUser } from "../services";
import { prisma } from "../db";
import { redisService } from "../redis";
import {
  healthService,
  securityService,
  projectsService,
  spotifyService,
  auditLogService,
} from "../services";

export interface Context {
  user: AuthUser | null;
  headers: Headers;
  prisma: typeof prisma;
  services: {
    auth: typeof authService;
    security: typeof securityService;
    health: typeof healthService;
    projects: typeof projectsService;
    spotify: typeof spotifyService;
    auditLog: typeof auditLogService;
    redis: typeof redisService;
  };
}

/**
 * Extract client IP from headers
 */
function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip") || "unknown";
}

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<Context> {
  const { req } = opts;

  // Extract auth token
  const authHeader = req.headers.get("authorization");
  let user: AuthUser | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      user = await authService.validateToken(token);
    } catch {
      // Invalid token, user remains null
    }
  }

  return {
    user,
    headers: req.headers,
    prisma,
    services: {
      auth: authService,
      security: securityService,
      health: healthService,
      projects: projectsService,
      spotify: spotifyService,
      auditLog: auditLogService,
      redis: redisService,
    },
  };
}

