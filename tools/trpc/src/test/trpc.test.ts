import { describe, it, expect } from "vitest";
import { createContext, router, publicProcedure, type Context } from "../trpc";

describe("createContext", () => {
  it("should return an empty object", async () => {
    const ctx = await createContext();
    expect(ctx).toEqual({} as Context);
  });
});

describe("router", () => {
  it("should be defined", () => {
    expect(router).toBeDefined();
    expect(typeof router).toBe("function");
  });
});

describe("publicProcedure", () => {
  it("should be defined", () => {
    expect(publicProcedure).toBeDefined();
    expect(typeof publicProcedure).toBe("object");
  });
});
