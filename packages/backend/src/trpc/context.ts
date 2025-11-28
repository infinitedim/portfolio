import * as trpc from "@trpc/server";
import type * as trpcExpress from "@trpc/server/adapters/express";
import type { Request } from "express";
import type { AuthUser } from "../auth/auth.service";
import { SecurityService } from "../security/security.service";
import { RedisService } from "../redis/redis.service";

export type TrpcContext = {
  req: Request;
  user?: AuthUser;
};

/**
 *
 * @param {trpcExpress.CreateExpressContextOptions} opts - The options for the context
 * @returns {Promise<TrpcContext>} - The context object
 */
export async function createBackendContext(
  opts: trpcExpress.CreateExpressContextOptions,
) {
  const authHeader = opts.req?.headers?.["authorization"];
  let user: AuthUser | undefined = undefined;

  // Parse and verify JWT token if present
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const securityService = new SecurityService(new RedisService());
      const payload = securityService.verifyAccessToken(token);

      if (payload && payload.userId) {
        user = {
          userId: payload.userId,
          email: payload.email || "",
          role: payload.role,
        };
      }
    } catch {
      // Token invalid or expired - user remains undefined
    }
  }

  return { req: opts.req, user } satisfies TrpcContext;
}

export type CreateBackendContext = trpc.inferAsyncReturnType<
  typeof createBackendContext
>;
