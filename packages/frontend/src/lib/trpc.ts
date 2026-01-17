import { createTRPCReact } from "@trpc/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server/trpc/router";

export const trpc = createTRPCReact<AppRouter>();

let trpcClient: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null =
  null;

/**
 * Get the tRPC API URL based on environment
 * Uses internal API route in production, external API in development
 */
function getTRPCUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/trpc";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/trpc";
}

if (typeof window !== "undefined") {
  try {
    trpcClient = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: getTRPCUrl(),
          headers: async () => {
            try {
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
