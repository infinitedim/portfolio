import * as trpc from "@trpc/server";
import type * as trpcExpress from "@trpc/server/adapters/express";
import type { Request } from "express";
import type { AuthUser } from "../auth/auth.service";
import {
  getServices,
  getSecurityService,
  getAuthService,
  type ServiceContainer,
} from "./services";
import { securityLogger } from "../logging/logger";

export type TrpcContext = {
  req: Request;
  user?: AuthUser;
  /** Singleton services - use these instead of creating new instances */
  services: ServiceContainer;
  /** Client IP address (validated) */
  clientIp: string;
};

/**
 * Extract client IP from request with proper proxy validation.
 * Only trusts X-Forwarded-For when request comes from a trusted proxy.
 *
 * @param {Request} req - Express request object
 * @returns {string} The client IP address
 */
function getClientIp(req: Request): string {
  const trustedProxies = (process.env.TRUSTED_PROXIES || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const socketIp = req.socket?.remoteAddress || req.ip || "unknown";

  // Only trust X-Forwarded-For if request came from a trusted proxy
  if (trustedProxies.length > 0 && trustedProxies.includes(socketIp)) {
    const xForwardedFor = req.headers["x-forwarded-for"];
    if (typeof xForwardedFor === "string") {
      // Take the first IP in the chain (original client)
      const clientIp = xForwardedFor.split(",")[0]?.trim();
      if (clientIp) {
        return clientIp;
      }
    }
  }

  // Fallback to socket remote address
  return socketIp;
}

/**
 * Create tRPC context with singleton services and validated request data.
 *
 * @param {trpcExpress.CreateExpressContextOptions} opts - The options for the context
 * @returns {Promise<TrpcContext>} - The context object with services
 */
export async function createBackendContext(
  opts: trpcExpress.CreateExpressContextOptions,
): Promise<TrpcContext> {
  const services = getServices();
  const clientIp = getClientIp(opts.req);
  const authHeader = opts.req?.headers?.["authorization"];
  let user: AuthUser | undefined = undefined;

  // Parse and verify JWT token if present
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const securityService = getSecurityService();
      const payload = securityService.verifyAccessToken(token);

      if (payload && payload.userId) {
        // Check if token is blacklisted
        const jti = securityService.extractJWTId(token);
        if (jti) {
          const authService = getAuthService();
          const isBlacklisted = await authService.isTokenBlacklisted(jti);
          if (isBlacklisted) {
            securityLogger.warn("Blacklisted token used in request", {
              jti,
              clientIp,
              component: "TrpcContext",
              operation: "createBackendContext",
            });
            // Token is blacklisted, don't set user
          } else {
            user = {
              userId: payload.userId,
              email: payload.email || "",
              role: payload.role,
            };
          }
        } else {
          // No JTI, but valid payload - allow (for backwards compatibility)
          user = {
            userId: payload.userId,
            email: payload.email || "",
            role: payload.role,
          };
        }
      }
    } catch (error) {
      // Token invalid or expired - user remains undefined
      securityLogger.debug("Token validation failed in context", {
        error: error instanceof Error ? error.message : "Unknown error",
        clientIp,
        component: "TrpcContext",
        operation: "createBackendContext",
      });
    }
  }

  return { req: opts.req, user, services, clientIp };
}

export type CreateBackendContext = trpc.inferAsyncReturnType<
  typeof createBackendContext
>;
