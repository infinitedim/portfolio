import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/lib/trpc/serverless-router";
import type { NextRequest } from "next/server";

/**
 * tRPC handler for Next.js App Router
 * This enables the tRPC router to work as serverless functions
 */
const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      // Create minimal context for serverless
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

export { handler as GET, handler as POST };
