"use client";

import React, { JSX, ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type TRPCProviderProps = {
  children: ReactNode;
};

/**
 * TRPCProvider component that provides React Query context
 * (tRPC functionality temporarily disabled to fix loading issues)
 * @param {TRPCProviderProps} props - The props for the TRPCProvider
 * @param {ReactNode} props.children - The children of the TRPCProvider
 * @returns {JSX.Element} The TRPCProvider component
 */
export function TRPCProvider({ children }: TRPCProviderProps): JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes
          },
          mutations: {
            retry: 1,
          },
        },
      }),
  );

  // Simple, consistent rendering to prevent hydration mismatches
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
