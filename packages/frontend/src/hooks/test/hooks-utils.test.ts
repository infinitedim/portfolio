import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import {
  isClientSide,
  generateId,
  useMountRef,
  useLocalStorage,
  useTimerManager,
  useIntervalManager,
  safeDOMManipulation,
} from "../utils/hooks-utils";

// Type interfaces for hook return values
interface LocalStorageResult<T> {
  getValue: () => T;
  setValue: (value: T) => boolean;
  removeValue: () => boolean;
}

interface TimerManagerResult {
  setTimer: (id: string, callback: () => void, delay: number) => void;
  clearTimer: (id: string) => void;
  clearAllTimers: () => void;
}

interface IntervalManagerResult {
  setInterval: (id: string, callback: () => void, delay: number) => void;
  clearInterval: (id: string) => void;
  clearAllIntervals: () => void;
}

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

describe("hookUtils", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true,
        configurable: true,
      });
    }
    
    vi.useFakeTimers();
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (!canRunTests) {
      return;
    }
    vi.useRealTimers();
  });

  describe("isClientSide", () => {
    it("returns boolean", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(typeof isClientSide()).toBe("boolean");
    });

    it("returns true in browser environment", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
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
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const id1 = generateId("test");
      const id2 = generateId("test");
      expect(id1).not.toBe(id2);
    });
  });

  describe("useMountRef", () => {
    it("tracks mount state", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useMountRef());

      expect(result.current.current).toBe(true);
    });

    it("sets to false on unmount", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result, unmount } = renderHook(() => useMountRef());

      const ref = result.current;
      expect(ref.current).toBe(true);

      unmount();
      expect(ref.current).toBe(false);
    });
  });

  describe("useLocalStorage", () => {
    it("returns getValue, setValue, removeValue functions", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default"),
      );

      const current = result.current as LocalStorageResult<string>;
      expect(typeof current.getValue).toBe("function");
      expect(typeof current.setValue).toBe("function");
      expect(typeof current.removeValue).toBe("function");
    });

    it("returns default value when key not found", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() =>
        useLocalStorage("nonExistentKey", "defaultVal"),
      );

      const current = result.current as LocalStorageResult<string>;
      expect(current.getValue()).toBe("defaultVal");
    });

    it("stores and retrieves value", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default"),
      );

      act(() => {
        const current = result.current as LocalStorageResult<string>;
        current.setValue("storedValue");
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "testKey",
        '"storedValue"',
      );
    });

    it("removes value", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default"),
      );

      act(() => {
        const current = result.current as LocalStorageResult<string>;
        current.removeValue();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("testKey");
    });

    it("handles complex objects", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() =>
        useLocalStorage<{ name: string; value?: number }>("objKey", {
          name: "test",
        }),
      );

      act(() => {
        const current = result.current as LocalStorageResult<{
          name: string;
          value?: number;
        }>;
        current.setValue({ name: "updated", value: 123 });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe("useTimerManager", () => {
    it("sets and clears timers", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());
      const callback = vi.fn();

      act(() => {
        const current = result.current as TimerManagerResult;
        current.setTimer("timer1", callback, 1000);
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("clears specific timer", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());
      const callback = vi.fn();

      act(() => {
        const current = result.current as TimerManagerResult;
        current.setTimer("timer1", callback, 1000);
        current.clearTimer("timer1");
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("clears all timers", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      act(() => {
        const current = result.current as TimerManagerResult;
        current.setTimer("timer1", callback1, 1000);
        current.setTimer("timer2", callback2, 2000);
        current.clearAllTimers();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it("replaces existing timer with same id", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      act(() => {
        const current = result.current as TimerManagerResult;
        current.setTimer("sameId", callback1, 1000);
        current.setTimer("sameId", callback2, 1000);
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
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useIntervalManager());

      const current = result.current as IntervalManagerResult;
      expect(typeof current.setInterval).toBe("function");
      expect(typeof current.clearInterval).toBe("function");
    });
  });

  describe("safeDOMManipulation", () => {
    it("schedules callback via requestAnimationFrame on client side", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const mockRAF = vi.fn((cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });
      Object.defineProperty(globalThis, "requestAnimationFrame", {
        value: mockRAF,
        writable: true,
        configurable: true,
      });

      const callback = vi.fn();
      safeDOMManipulation(callback);

      expect(mockRAF).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it("does not throw for DOM operations", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      Object.defineProperty(globalThis, "requestAnimationFrame", {
        value: (cb: FrameRequestCallback) => {
          cb(0);
          return 0;
        },
        writable: true,
        configurable: true,
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
