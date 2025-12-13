import { createTRPCReact } from "@trpc/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/lib/trpc/serverless-router";

// Create tRPC React hooks with proper typing
export const trpc = createTRPCReact<AppRouter>();

// Create tRPC client for direct calls (non-hook usage) - only on client side
let trpcClient: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null =
  null;

/**
 * Get the tRPC API URL based on environment
 * Uses internal API route in production, external API in development
 */
function getTRPCUrl(): string {
  if (typeof window !== "undefined") {
    // Browser: use relative URL for internal API route
    return "/api/trpc";
  }
  // SSR: use absolute URL
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/trpc";
}

// Only create the client on the client side
if (typeof window !== "undefined") {
  try {
    trpcClient = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: getTRPCUrl(),
          headers: async () => {
            try {
              // Import authService dynamically to get current in-memory token
              // This aligns with the secure token storage pattern used by AuthService
              // which keeps access tokens in memory only (not localStorage)
              const { authService } = await import("./auth/authService");
              const memoryToken = authService.getAccessToken();
              if (memoryToken) {
                return { Authorization: `Bearer ${memoryToken}` };
              }
              return {};
            } catch (err) {
              console.warn("Token retrieval failed:", err);
              return {};
            }
          },
        }),
      ],
    });
  } catch (error) {
    console.warn("Failed to create tRPC client:", error);
  }
}

// Export a function to get the client safely
/**
 *
 */
export function getTRPCClient() {
  if (typeof window === "undefined") {
    throw new Error("tRPC client is only available on the client side");
  }

  if (!trpcClient) {
    throw new Error("tRPC client failed to initialize");
  }

  return trpcClient;
}

export { trpcClient };
