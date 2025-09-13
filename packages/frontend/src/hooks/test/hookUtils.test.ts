import { describe, it, expect } from "vitest";
import { isClientSide, generateId } from "../utils/hookUtils";

describe("hookUtils", () => {
  it("generateId produces a string and isClientSide returns boolean", () => {
    const id = generateId("test");
    expect(typeof id).toBe("string");
    expect(typeof isClientSide()).toBe("boolean");
  });
});
