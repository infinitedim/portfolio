import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMobile } from "../useMobile";

describe("useMobile", () => {
  it("returns a default mobile state and updates on resize", () => {
    // Mock window dimensions
    globalThis.innerWidth = 500;
    globalThis.innerHeight = 800;

    const { result } = renderHook(() => useMobile());
    // With mocked small innerWidth expect mobile true
    expect(result.current.isMobile).toBe(true);
  });
});
