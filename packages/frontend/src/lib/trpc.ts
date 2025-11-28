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
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}/api/trpc`;
  }
  // Fallback for local development
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/trpc";
}

// Only create the client on the client side
if (typeof window !== "undefined") {
  try {
    trpcClient = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: getTRPCUrl(),
          headers: () => {
            try {
              const token = localStorage.getItem("accessToken");
              return token ? { Authorization: `Bearer ${token}` } : {};
            } catch (error) {
              console.warn("Failed to access localStorage:", error);
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
