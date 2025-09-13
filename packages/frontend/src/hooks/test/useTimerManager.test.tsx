/* eslint-disable prettier/prettier */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTimerManager, useAnimationFrame } from "../useTimerManager";

describe("useTimerManager", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("sets and clears timeouts and intervals", () => {
    const { result } = renderHook(() => useTimerManager());
    const id = result.current.setTimeout(() => { }, 1000, "t1");
    expect(typeof id).toBe("string");
    result.current.clearTimeout(id);
  });

  it("animation frame request and cancel", () => {
    const { result } = renderHook(() => useAnimationFrame());
    const id = result.current.requestFrame(() => { });
    expect(typeof id).toBe("number");
    result.current.cancelFrame();
  });
});
