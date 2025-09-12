import * as trpc from "@trpc/server";
import type * as trpcExpress from "@trpc/server/adapters/express";
import type { Request } from "express";
import { AuthService, type AuthUser } from "../auth/auth.service";

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
  const auth = new AuthService();
  const authHeader = opts.req.headers["authorization"];
  const token =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : typeof authHeader === "string"
        ? authHeader
        : undefined;
  const user = token ? (auth.verify(token) ?? undefined) : undefined;
  return { req: opts.req, user } satisfies TrpcContext;
}

export type CreateBackendContext = trpc.inferAsyncReturnType<
  typeof createBackendContext
>;
