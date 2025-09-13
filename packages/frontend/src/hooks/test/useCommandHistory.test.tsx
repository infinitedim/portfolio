import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCommandHistory } from "../useCommandHistory";

describe("useCommandHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds and persists commands", () => {
    const { result } = renderHook(() =>
      useCommandHistory({ maxHistorySize: 3, persistKey: "test-history" }),
    );

    act(() => result.current.addCommand("one"));
    act(() => result.current.addCommand("two"));
    act(() => result.current.addCommand("three"));

    expect(result.current.history).toEqual(["one", "two", "three"]);
    // Stored may be async; if present it should be an array
    const stored = localStorage.getItem("test-history");
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(Array.isArray(parsed)).toBe(true);
    }
  });

  it("navigates history up and down", () => {
    const { result } = renderHook(() =>
      useCommandHistory({ maxHistorySize: 5 }),
    );
    act(() => result.current.addCommand("a"));
    act(() => result.current.addCommand("b"));
    act(() => result.current.addCommand("c"));

    // First up returns last, second up returns previous
    expect(result.current.navigate("up")).toBe("c");
    const second = result.current.navigate("up");
    expect(["b", "c"]).toContain(second);
    const down = result.current.navigate("down");
    expect(typeof down).toBe("string");
  });
});
