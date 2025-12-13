import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  isClientSide,
  generateId,
  useMountRef,
  useLocalStorage,
  useTimerManager,
  useIntervalManager,
  safeDOMManipulation,
} from "../utils/hookUtils";

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal("localStorage", mockLocalStorage);

describe("hookUtils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isClientSide", () => {
    it("returns boolean", () => {
      expect(typeof isClientSide()).toBe("boolean");
    });

    it("returns true in browser environment", () => {
      // In test environment with jsdom, window is defined
      expect(isClientSide()).toBe(true);
    });
  });

  describe("generateId", () => {
    it("produces a string", () => {
      const id = generateId("test");
      expect(typeof id).toBe("string");
    });

    it("includes prefix when provided", () => {
      const id = generateId("myprefix");
      expect(id).toContain("myprefix");
    });

    it("generates unique ids", () => {
      const id1 = generateId("test");
      const id2 = generateId("test");
      expect(id1).not.toBe(id2);
    });
  });

  describe("useMountRef", () => {
    it("tracks mount state", () => {
      const { result } = renderHook(() => useMountRef());

      expect(result.current.current).toBe(true);
    });

    it("sets to false on unmount", () => {
      const { result, unmount } = renderHook(() => useMountRef());

      const ref = result.current;
      expect(ref.current).toBe(true);

      unmount();
      expect(ref.current).toBe(false);
    });
  });

  describe("useLocalStorage", () => {
    it("returns getValue, setValue, removeValue functions", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default"),
      );

      expect(typeof result.current.getValue).toBe("function");
      expect(typeof result.current.setValue).toBe("function");
      expect(typeof result.current.removeValue).toBe("function");
    });

    it("returns default value when key not found", () => {
      const { result } = renderHook(() =>
        useLocalStorage("nonExistentKey", "defaultVal"),
      );

      expect(result.current.getValue()).toBe("defaultVal");
    });

    it("stores and retrieves value", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default"),
      );

      act(() => {
        result.current.setValue("storedValue");
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "testKey",
        '"storedValue"',
      );
    });

    it("removes value", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default"),
      );

      act(() => {
        result.current.removeValue();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("testKey");
    });

    it("handles complex objects", () => {
      const { result } = renderHook(() =>
        useLocalStorage<{ name: string; value?: number }>("objKey", {
          name: "test",
        }),
      );

      act(() => {
        result.current.setValue({ name: "updated", value: 123 });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe("useTimerManager", () => {
    it("sets and clears timers", () => {
      const { result } = renderHook(() => useTimerManager());
      const callback = vi.fn();

      act(() => {
        result.current.setTimer("timer1", callback, 1000);
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("clears specific timer", () => {
      const { result } = renderHook(() => useTimerManager());
      const callback = vi.fn();

      act(() => {
        result.current.setTimer("timer1", callback, 1000);
        result.current.clearTimer("timer1");
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("clears all timers", () => {
      const { result } = renderHook(() => useTimerManager());
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      act(() => {
        result.current.setTimer("timer1", callback1, 1000);
        result.current.setTimer("timer2", callback2, 2000);
        result.current.clearAllTimers();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it("replaces existing timer with same id", () => {
      const { result } = renderHook(() => useTimerManager());
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      act(() => {
        result.current.setTimer("sameId", callback1, 1000);
        result.current.setTimer("sameId", callback2, 1000);
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe("useIntervalManager", () => {
    it("returns setInterval and clearInterval functions", () => {
      const { result } = renderHook(() => useIntervalManager());

      expect(typeof result.current.setInterval).toBe("function");
      expect(typeof result.current.clearInterval).toBe("function");
    });
  });

  describe("safeDOMManipulation", () => {
    it("schedules callback via requestAnimationFrame on client side", () => {
      const mockRAF = vi.fn((cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });
      vi.stubGlobal("requestAnimationFrame", mockRAF);

      const callback = vi.fn();
      safeDOMManipulation(callback);

      expect(mockRAF).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it("does not throw for DOM operations", () => {
      vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });

      expect(() => {
        safeDOMManipulation(() => {
          // Simulate DOM operation
          const div = document.createElement("div");
          div.textContent = "test";
        });
      }).not.toThrow();
    });
  });
});
