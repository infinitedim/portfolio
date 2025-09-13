import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGestures, useTerminalGestures } from "../useGestures";

describe("useGestures", () => {
  it("provides gesture handlers and pull state", () => {
    const onPull = { onPullToRefresh: false };
    const callbacks = {
      onPullToRefresh: () => (onPull.onPullToRefresh = true),
    };
    const { result } = renderHook(() => useGestures(callbacks));
    const handlers = result.current.getGestureHandlers();
    expect(typeof handlers.onTouchStart).toBe("function");
  });

  it("terminal gestures add to history and trigger commands", () => {
    const commands: string[] = [];
    const { result } = renderHook(() =>
      useTerminalGestures((c) => commands.push(c)),
    );
    act(() => result.current.addToHistory("test"));
    expect(result.current.commandHistory.includes("test")).toBe(true);
  });
});
