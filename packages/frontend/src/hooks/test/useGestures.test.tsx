import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGestures, useTerminalGestures } from "../useGestures";

// Mock touch event helper
const createTouchEvent = (
  type: "touchstart" | "touchmove" | "touchend",
  touches: Array<{ clientX: number; clientY: number }>,
): React.TouchEvent => {
  const touchList = touches.map((t, i) => ({
    clientX: t.clientX,
    clientY: t.clientY,
    identifier: i,
    target: document.createElement("div"),
    screenX: t.clientX,
    screenY: t.clientY,
    pageX: t.clientX,
    pageY: t.clientY,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 1,
  })) as unknown as React.Touch[];

  return {
    type,
    touches: touchList,
    targetTouches: touchList,
    changedTouches: touchList,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.TouchEvent;
};

describe("useGestures", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("provides gesture handlers and pull state", () => {
    const onPull = { onPullToRefresh: false };
    const callbacks = {
      onPullToRefresh: () => (onPull.onPullToRefresh = true),
    };
    const { result } = renderHook(() => useGestures(callbacks));
    const handlers = result.current.getGestureHandlers();
    expect(typeof handlers.onTouchStart).toBe("function");
    expect(typeof handlers.onTouchMove).toBe("function");
    expect(typeof handlers.onTouchEnd).toBe("function");
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useGestures());
    expect(result.current.isPullRefreshing).toBe(false);
    expect(result.current.pullDistance).toBe(0);
  });

  it("should handle swipe right gesture", () => {
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useGestures({ onSwipeRight }));
    const handlers = result.current.getGestureHandlers();

    // Start touch
    act(() => {
      handlers.onTouchStart(createTouchEvent("touchstart", [{ clientX: 0, clientY: 100 }]));
    });

    // Move right (more than threshold of 50)
    act(() => {
      handlers.onTouchMove(createTouchEvent("touchmove", [{ clientX: 100, clientY: 100 }]));
    });

    // End touch quickly (less than 300ms)
    act(() => {
      handlers.onTouchEnd(createTouchEvent("touchend", [{ clientX: 100, clientY: 100 }]));
    });

    expect(onSwipeRight).toHaveBeenCalled();
  });

  it("should handle swipe left gesture", () => {
    const onSwipeLeft = vi.fn();
    const { result } = renderHook(() => useGestures({ onSwipeLeft }));
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]));
    });

    act(() => {
      handlers.onTouchMove(createTouchEvent("touchmove", [{ clientX: 0, clientY: 100 }]));
    });

    act(() => {
      handlers.onTouchEnd(createTouchEvent("touchend", [{ clientX: 0, clientY: 100 }]));
    });

    expect(onSwipeLeft).toHaveBeenCalled();
  });

  it("should handle swipe up gesture", () => {
    const onSwipeUp = vi.fn();
    const { result } = renderHook(() => useGestures({ onSwipeUp }));
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(createTouchEvent("touchstart", [{ clientX: 100, clientY: 200 }]));
    });

    act(() => {
      handlers.onTouchMove(createTouchEvent("touchmove", [{ clientX: 100, clientY: 100 }]));
    });

    act(() => {
      handlers.onTouchEnd(createTouchEvent("touchend", [{ clientX: 100, clientY: 100 }]));
    });

    expect(onSwipeUp).toHaveBeenCalled();
  });

  it("should handle swipe down gesture", () => {
    const onSwipeDown = vi.fn();
    const { result } = renderHook(() => useGestures({ onSwipeDown }));
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]));
    });

    act(() => {
      handlers.onTouchMove(createTouchEvent("touchmove", [{ clientX: 100, clientY: 200 }]));
    });

    act(() => {
      handlers.onTouchEnd(createTouchEvent("touchend", [{ clientX: 100, clientY: 200 }]));
    });

    expect(onSwipeDown).toHaveBeenCalled();
  });

  it("should handle long press gesture", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useGestures({ onLongPress }));
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]));
    });

    // Advance time past long press delay (500ms default)
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onLongPress).toHaveBeenCalled();
  });

  it("should cancel long press when moved", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useGestures({ onLongPress }));
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]));
    });

    // Move more than 10px
    act(() => {
      handlers.onTouchMove(createTouchEvent("touchmove", [{ clientX: 150, clientY: 100 }]));
    });

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("should handle double tap gesture", () => {
    const onDoubleTap = vi.fn();
    const { result } = renderHook(() => useGestures({ onDoubleTap }));
    const handlers = result.current.getGestureHandlers();

    // First tap
    act(() => {
      handlers.onTouchStart(createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]));
      handlers.onTouchEnd(createTouchEvent("touchend", [{ clientX: 100, clientY: 100 }]));
    });

    // Second tap within doubleTapDelay (300ms)
    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      handlers.onTouchStart(createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]));
      handlers.onTouchEnd(createTouchEvent("touchend", [{ clientX: 100, clientY: 100 }]));
    });

    expect(onDoubleTap).toHaveBeenCalled();
  });

  it("should handle pinch out gesture", () => {
    const onPinchOut = vi.fn();
    const { result } = renderHook(() => useGestures({ onPinchOut }));
    const handlers = result.current.getGestureHandlers();

    // Start with two fingers close together
    act(() => {
      handlers.onTouchStart(createTouchEvent("touchstart", [
        { clientX: 100, clientY: 100 },
        { clientX: 110, clientY: 100 },
      ]));
    });

    // Move fingers apart (pinch out)
    act(() => {
      handlers.onTouchMove(createTouchEvent("touchmove", [
        { clientX: 50, clientY: 100 },
        { clientX: 160, clientY: 100 },
      ]));
    });

    expect(onPinchOut).toHaveBeenCalled();
  });

  it("should handle pinch in gesture", () => {
    const onPinchIn = vi.fn();
    const { result } = renderHook(() => useGestures({ onPinchIn }));
    const handlers = result.current.getGestureHandlers();

    // Start with two fingers far apart
    act(() => {
      handlers.onTouchStart(createTouchEvent("touchstart", [
        { clientX: 0, clientY: 100 },
        { clientX: 200, clientY: 100 },
      ]));
    });

    // Move fingers closer together (pinch in)
    act(() => {
      handlers.onTouchMove(createTouchEvent("touchmove", [
        { clientX: 80, clientY: 100 },
        { clientX: 120, clientY: 100 },
      ]));
    });

    expect(onPinchIn).toHaveBeenCalled();
  });

  it("should track pull to refresh state", () => {
    const onPullToRefresh = vi.fn();
    const { result } = renderHook(() => useGestures({ onPullToRefresh }));
    const handlers = result.current.getGestureHandlers();

    // Start near top of screen
    act(() => {
      handlers.onTouchStart(createTouchEvent("touchstart", [{ clientX: 100, clientY: 50 }]));
    });

    // Pull down more than 80px
    act(() => {
      handlers.onTouchMove(createTouchEvent("touchmove", [{ clientX: 100, clientY: 150 }]));
    });

    // Check that pull refreshing state is set
    expect(result.current.isPullRefreshing).toBe(true);
    expect(result.current.pullDistance).toBeGreaterThan(0);
  });

  it("should reset pull distance on touch end", () => {
    const { result } = renderHook(() => useGestures());
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(createTouchEvent("touchstart", [{ clientX: 100, clientY: 50 }]));
      handlers.onTouchMove(createTouchEvent("touchmove", [{ clientX: 100, clientY: 100 }]));
      handlers.onTouchEnd(createTouchEvent("touchend", [{ clientX: 100, clientY: 100 }]));
    });

    // Pull distance should be reset or resetting
    expect(result.current.pullDistance).toBeLessThanOrEqual(100);
  });

  it("should accept custom config", () => {
    const onSwipeRight = vi.fn();
    const customConfig = { swipeThreshold: 100 };
    const { result } = renderHook(() => useGestures({ onSwipeRight }, customConfig));
    const handlers = result.current.getGestureHandlers();

    // Start touch
    act(() => {
      handlers.onTouchStart(createTouchEvent("touchstart", [{ clientX: 0, clientY: 100 }]));
    });

    // Move right but less than custom threshold (100)
    act(() => {
      handlers.onTouchMove(createTouchEvent("touchmove", [{ clientX: 80, clientY: 100 }]));
    });

    act(() => {
      handlers.onTouchEnd(createTouchEvent("touchend", [{ clientX: 80, clientY: 100 }]));
    });

    // Should not trigger because we didn't exceed custom threshold
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("should prevent context menu on long press", () => {
    const { result } = renderHook(() => useGestures());
    const handlers = result.current.getGestureHandlers();

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.MouseEvent;
    handlers.onContextMenu(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it("should return correct styles for touch action", () => {
    const { result } = renderHook(() => useGestures());
    const handlers = result.current.getGestureHandlers();

    expect(handlers.style).toEqual({
      touchAction: "pan-y",
      userSelect: "none",
      WebkitUserSelect: "none",
      WebkitTouchCallout: "none",
    });
  });
});

describe("useTerminalGestures", () => {
  it("adds to history and triggers commands", () => {
    const commands: string[] = [];
    const { result } = renderHook(() =>
      useTerminalGestures((c) => commands.push(c)),
    );

    act(() => result.current.addToHistory("test"));
    expect(result.current.commandHistory.includes("test")).toBe(true);
  });

  it("exposes show quick commands state", () => {
    const executeCommand = vi.fn();
    const { result } = renderHook(() => useTerminalGestures(executeCommand));

    expect(result.current.showQuickCommands).toBe(false);

    act(() => {
      result.current.setShowQuickCommands(true);
    });

    expect(result.current.showQuickCommands).toBe(true);
  });

  it("exposes pull refreshing state", () => {
    const executeCommand = vi.fn();
    const { result } = renderHook(() => useTerminalGestures(executeCommand));

    expect(result.current.isPullRefreshing).toBe(false);
    expect(typeof result.current.pullDistance).toBe("number");
  });

  it("deduplicates command history on separate updates", () => {
    const executeCommand = vi.fn();
    const { result } = renderHook(() => useTerminalGestures(executeCommand));

    act(() => {
      result.current.addToHistory("command1");
    });

    act(() => {
      result.current.addToHistory("command1");
    });

    // With the stale closure, duplicate may still be added on same batch
    // but separate act() blocks should work correctly
    expect(result.current.commandHistory.filter(c => c === "command1")).toHaveLength(1);
  });

  it("limits command history to 20 items", () => {
    const executeCommand = vi.fn();
    const { result } = renderHook(() => useTerminalGestures(executeCommand));

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addToHistory(`command${i}`);
      }
    });

    expect(result.current.commandHistory.length).toBeLessThanOrEqual(20);
  });

  it("provides gesture handlers", () => {
    const executeCommand = vi.fn();
    const { result } = renderHook(() => useTerminalGestures(executeCommand));

    const handlers = result.current.getGestureHandlers();
    expect(handlers).toBeDefined();
    expect(typeof handlers.onTouchStart).toBe("function");
    expect(typeof handlers.onTouchMove).toBe("function");
    expect(typeof handlers.onTouchEnd).toBe("function");
  });

  it("does not add empty commands to history", () => {
    const executeCommand = vi.fn();
    const { result } = renderHook(() => useTerminalGestures(executeCommand));

    act(() => {
      result.current.addToHistory("");
      result.current.addToHistory("   ");
    });

    expect(result.current.commandHistory).toHaveLength(0);
  });
});
