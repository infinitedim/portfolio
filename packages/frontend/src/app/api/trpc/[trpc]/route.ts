import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/lib/trpc/serverless-router";
import type { NextRequest } from "next/server";

/**
 * tRPC API route handler for Next.js App Router
 * @param req - Next.js request object
 * @returns Fetch handler response
 * @remarks
 * Configures tRPC to work as serverless functions with:
 * - Dynamic route handling for all tRPC procedures
 * - Empty context creation (can be extended for auth)
 * - Development error logging
 * - Both GET and POST method support
 * - Serverless-optimized router configuration
 */
const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      return {};
    },
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }: { path: string | undefined; error: Error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            );
          }
        : undefined,
  });

/**
 * GET handler for tRPC API routes
 * Handles tRPC query procedures via GET requests
 */
export { handler as GET };

/**
 * POST handler for tRPC API routes
 * Handles tRPC mutation procedures via POST requests
 */
export { handler as POST };
