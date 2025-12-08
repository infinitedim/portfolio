/**
 * tRPC procedure definitions with security middleware.
 * Provides protected procedures that enforce CSRF validation on mutations.
 *
 * @module trpc/procedures
 */

import { initTRPC, TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context";
import { getCSRFService } from "./services";
import { securityLogger } from "../logging/logger";

// Initialize tRPC with our context type
const t = initTRPC.context<TrpcContext>().create();

/**
 * CSRF validation middleware.
 * Validates the x-csrf-token header against the stored token for the session.
 */
const csrfMiddleware = t.middleware(async ({ ctx, next, type }) => {
  // Only validate CSRF for mutations (state-changing operations)
  if (type !== "mutation") {
    return next({ ctx });
  }

  // Skip CSRF for login/refresh endpoints (they handle their own security)
  // These are allowed because:
  // 1. Login requires valid credentials
  // 2. Refresh requires a valid refresh token
  // The CSRF token is obtained after login via the getCsrfToken endpoint
  const path = (ctx.req as { path?: string }).path || "";
  if (path.includes("auth.login") || path.includes("auth.refresh")) {
    return next({ ctx });
  }

  const csrfService = getCSRFService();

  // Extract CSRF token from request
  const csrfToken = csrfService.extractTokenFromRequest(ctx.req);
  if (!csrfToken) {
    securityLogger.warn("CSRF token missing on mutation", {
      clientIp: ctx.clientIp,
      path,
      component: "TrpcProcedures",
      operation: "csrfMiddleware",
    });
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "CSRF token required for this operation",
    });
  }

  // Get session ID and validate token
  const sessionId = csrfService.getSessionId(ctx.req);
  const validationResult = await csrfService.validateToken(
    sessionId,
    csrfToken,
  );

  if (!validationResult.isValid) {
    securityLogger.warn("CSRF validation failed", {
      clientIp: ctx.clientIp,
      path,
      error: validationResult.error,
      component: "TrpcProcedures",
      operation: "csrfMiddleware",
    });
    throw new TRPCError({
      code: "FORBIDDEN",
      message: validationResult.error || "Invalid CSRF token",
    });
  }

  return next({ ctx });
});

/**
 * Auth middleware - requires authenticated user in context.
 */
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now guaranteed to exist
    },
  });
});

// Base router and public procedure (no CSRF, no auth)
export const router = t.router;
export const publicProcedure = t.procedure;

// CSRF-protected procedure for mutations that don't require auth
// (rare, but possible for things like contact forms)
export const csrfProcedure = t.procedure.use(csrfMiddleware);

// Auth-protected procedure (requires authentication)
export const protectedProcedure = t.procedure.use(authMiddleware);

// Fully protected procedure (requires both auth AND CSRF)
// Use this for sensitive mutations that change data
export const protectedMutationProcedure = t.procedure
  .use(authMiddleware)
  .use(csrfMiddleware);
