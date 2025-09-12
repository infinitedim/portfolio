import { createTRPCReact } from "@trpc/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

// Create tRPC React hooks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpc = createTRPCReact<any>();

// Create tRPC client for direct calls (non-hook usage) - only on client side
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let trpcClient: any = null;

// Only create the client on the client side
if (typeof window !== "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trpcClient = createTRPCProxyClient<any>({
      links: [
        httpBatchLink({
          url: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/trpc",
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
  return trpcClient;
}

export { trpcClient };
