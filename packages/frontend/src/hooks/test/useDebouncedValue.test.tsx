import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedValue, useDebouncedCallback } from "../useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces a changing value", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      {
        initialProps: { value: "a", delay: 200 },
      },
    );

    expect(result.current).toBe("a");

    rerender({ value: "b", delay: 200 });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe("b");
  });

  it("debounced callback calls after delay", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(cb, 100));

    act(() => {
      result.current("x");
      result.current("y");
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith("y");
  });
});
