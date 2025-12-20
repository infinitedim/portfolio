import { initTRPC } from "@trpc/server";
import type { inferAsyncReturnType } from "@trpc/server";
import type { Request } from "express";

export type TrpcContext = {
  req: Request;
  user?: {
    userId: string;
    email: string;
    role: "admin";
  };
};

/**
 * @description Create a context for the TRPC server
 * @returns {Promise<TrpcContext>} - The context object
 */
export async function createContext(): Promise<TrpcContext> {
  return {} as TrpcContext;
}

export type Context = inferAsyncReturnType<typeof createContext>;

const t = initTRPC.context<TrpcContext>().create();
export const router = t.router;
export const publicProcedure = t.procedure;
