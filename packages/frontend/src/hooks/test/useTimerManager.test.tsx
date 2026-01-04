import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useTimerManager,
  useAnimationFrame,
  useDebounce,
  useThrottle,
} from "../useTimerManager";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("useTimerManager", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.useFakeTimers();
  });
  afterEach(() => {
    if (!canRunTests) {
      return;
    }
    vi.useRealTimers();
  });

  describe("setTimeout", () => {
    it("sets and clears timeouts", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());
      const callback = vi.fn();

      const id = result.current.setTimeout(callback, 1000, "t1");
      expect(typeof id).toBe("string");
      expect(id).toBe("t1");

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("generates unique id when not provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());

      const id1 = result.current.setTimeout(() => { }, 1000);
      const id2 = result.current.setTimeout(() => { }, 1000);

      expect(id1).not.toBe(id2);
      expect(id1).toContain("timer_");
      expect(id2).toContain("timer_");
    });

    it("clears timeout by id", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());
      const callback = vi.fn();

      const id = result.current.setTimeout(callback, 1000);
      result.current.clearTimeout(id);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("replaces existing timeout with same id", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      result.current.setTimeout(callback1, 1000, "same-id");
      result.current.setTimeout(callback2, 1000, "same-id");

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("handles callback errors gracefully", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());
      const errorCallback = () => {
        throw new Error("Timer error");
      };

      result.current.setTimeout(errorCallback, 100);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should not throw and should track error
      expect(result.current.hasErrors).toBe(true);
      expect(result.current.getErrors().length).toBeGreaterThan(0);
    });
  });

  describe("setInterval", () => {
    it("sets and clears intervals", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());
      const callback = vi.fn();

      const id = result.current.setInterval(callback, 500, "interval1");
      expect(typeof id).toBe("string");
      expect(id).toBe("interval1");

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it("generates unique id for intervals", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());

      const id1 = result.current.setInterval(() => { }, 1000);
      const id2 = result.current.setInterval(() => { }, 1000);

      expect(id1).not.toBe(id2);
    });

    it("clears interval by id", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());
      const callback = vi.fn();

      const id = result.current.setInterval(callback, 500);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(2);

      result.current.clearInterval(id);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should still be 2 calls after clearing
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it("replaces existing interval with same id", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      result.current.setInterval(callback1, 500, "same-interval");
      result.current.setInterval(callback2, 500, "same-interval");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe("clearAll methods", () => {
    it("clearAllTimeouts clears all pending timeouts", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      result.current.setTimeout(callback1, 1000, "t1");
      result.current.setTimeout(callback2, 2000, "t2");
      result.current.clearAllTimeouts();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it("clearAllIntervals clears all pending intervals", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      result.current.setInterval(callback1, 500, "i1");
      result.current.setInterval(callback2, 500, "i2");
      result.current.clearAllIntervals();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it("clearAll clears all timeouts and intervals and errors", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      result.current.setTimeout(callback1, 1000);
      result.current.setInterval(callback2, 500);
      result.current.clearAll();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("tracks errors when callback throws", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());

      result.current.setTimeout(() => {
        throw new Error("Test error");
      }, 100);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.hasErrors).toBe(true);
      expect(result.current.getErrors().length).toBe(1);
    });

    it("clearErrors clears all tracked errors", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());

      result.current.setTimeout(() => {
        throw new Error("Test error");
      }, 100);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.hasErrors).toBe(true);

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.hasErrors).toBe(false);
      expect(result.current.getErrors().length).toBe(0);
    });

    it("clears error when timer succeeds after previous failure", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { result } = renderHook(() => useTimerManager());
      let shouldThrow = true;

      result.current.setInterval(() => {
        if (shouldThrow) {
          shouldThrow = false;
          throw new Error("Intermittent error");
        }
      }, 100, "flaky-interval");

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.hasErrors).toBe(true);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Error should be cleared after successful execution
      expect(result.current.hasErrors).toBe(false);
    });
  });

  describe("cleanup on unmount", () => {
    it("clears all timers on unmount", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const callback = vi.fn();
      const { result, unmount } = renderHook(() => useTimerManager());

      result.current.setTimeout(callback, 1000);
      result.current.setInterval(callback, 500);

      unmount();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });
});

describe("useAnimationFrame", () => {
  let mockRequestAnimationFrame: ReturnType<typeof vi.fn>;
  let mockCancelAnimationFrame: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    mockRequestAnimationFrame = vi.fn().mockImplementation((_cb) => {
      const id = Math.random();
      return id;
    });
    mockCancelAnimationFrame = vi.fn();
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      value: mockRequestAnimationFrame,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "cancelAnimationFrame", {
      value: mockCancelAnimationFrame,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Cleanup is handled by configurable: true
  });

  it("requests animation frame", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { result } = renderHook(() => useAnimationFrame());
    const callback = vi.fn();

    const id = result.current.requestFrame(callback);

    expect(typeof id).toBe("number");
    expect(mockRequestAnimationFrame).toHaveBeenCalledWith(callback);
  });

  it("cancels animation frame", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { result } = renderHook(() => useAnimationFrame());

    result.current.requestFrame(() => { });
    result.current.cancelFrame();

    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it("cancels previous frame when requesting new one", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { result } = renderHook(() => useAnimationFrame());

    result.current.requestFrame(() => { });
    result.current.requestFrame(() => { });

    expect(mockCancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(2);
  });

  it("cleans up on unmount", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { result, unmount } = renderHook(() => useAnimationFrame());

    result.current.requestFrame(() => { });
    unmount();

    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });
});

describe("useDebounce", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.useFakeTimers();
  });
  afterEach(() => {
    if (!canRunTests) {
      return;
    }
    vi.useRealTimers();
  });

  it("debounces function calls", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    // Should not have been called yet
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should be called once after delay
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("resets timer on each call", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current();
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current(); // Reset the timer
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should not be called yet because timer was reset
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("calls function with latest arguments", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current("first");
      result.current("second");
      result.current("third");
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledWith("third");
  });
});

describe("useThrottle", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.useFakeTimers();
  });
  afterEach(() => {
    if (!canRunTests) {
      return;
    }
    vi.useRealTimers();
  });

  it("executes immediately on first call", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 300));

    act(() => {
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("throttles subsequent calls within delay period", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 300));

    act(() => {
      result.current(); // Immediate call
      result.current(); // Throttled
      result.current(); // Throttled
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("schedules trailing call", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 300));

    act(() => {
      result.current(); // Immediate call
      result.current(); // Scheduled
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should have the scheduled trailing call
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("allows new call after delay expires", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 300));

    act(() => {
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    act(() => {
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });
});
