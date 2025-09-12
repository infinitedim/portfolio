import * as trpc from "@trpc/server";
import type * as trpcExpress from "@trpc/server/adapters/express";
import type { Request } from "express";
import type { AuthUser } from "../auth/auth.service";

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
  // Avoid constructing services here; just parse the token. Verification
  // should be performed where DI is available (e.g., in resolvers).
  const authHeader = opts.req?.headers?.["authorization"];

  // Note: we intentionally do not verify the token here to avoid
  // constructing services in a minimal context. Resolvers should
  // perform verification when they have access to application services.
  void authHeader;

  const user: AuthUser | undefined = undefined;

  return { req: opts.req, user } satisfies TrpcContext;
}

export type CreateBackendContext = trpc.inferAsyncReturnType<
  typeof createBackendContext
>;
