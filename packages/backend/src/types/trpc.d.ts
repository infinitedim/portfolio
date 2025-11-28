declare module "@portfolio/trpc" {
  import { initTRPC } from "@trpc/server";
  import type { Request } from "express";

  export type TrpcContext = {
    req: Request;
    user?: {
      userId: string;
      email: string;
      role: "admin";
    };
  };

  export function createContext(): Promise<TrpcContext>;

  const t: ReturnType<
    ReturnType<typeof initTRPC.context<TrpcContext>>["create"]
  >;

  export const router: typeof t.router;
  export const publicProcedure: typeof t.procedure;
}
