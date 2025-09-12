import { useRef, useCallback, useEffect } from "react";

/**
 * Enhanced timer management utility with automatic cleanup
 * Prevents memory leaks by tracking and cleaning up all timers
 */

interface TimerManager {
  setTimeout: (callback: () => void, delay: number, id?: string) => string;
  setInterval: (callback: () => void, delay: number, id?: string) => string;
  clearTimeout: (id: string) => void;
  clearInterval: (id: string) => void;
  clearAll: () => void;
  clearAllTimeouts: () => void;
  clearAllIntervals: () => void;
}

/**
 *
 */
export function useTimerManager(): TimerManager {
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const idCounterRef = useRef(0);

  const generateId = useCallback((): string => {
    idCounterRef.current += 1;
    return `timer_${Date.now()}_${idCounterRef.current}`;
  }, []);

  const setTimeout = useCallback(
    (callback: () => void, delay: number, id?: string): string => {
      const timerId = id || generateId();

      // Clear existing timeout with same id
      const existingTimeout = timeoutsRef.current.get(timerId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = global.setTimeout(() => {
        callback();
        timeoutsRef.current.delete(timerId);
      }, delay);

      timeoutsRef.current.set(timerId, timeout);
      return timerId;
    },
    [generateId],
  );

  const setInterval = useCallback(
    (callback: () => void, delay: number, id?: string): string => {
      const timerId = id || generateId();

      // Clear existing interval with same id
      const existingInterval = intervalsRef.current.get(timerId);
      if (existingInterval) {
        clearInterval(existingInterval);
      }

      const interval = global.setInterval(callback, delay);
      intervalsRef.current.set(timerId, interval);
      return timerId;
    },
    [generateId],
  );

  const clearTimeoutById = useCallback((id: string): void => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      global.clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const clearIntervalById = useCallback((id: string): void => {
    const interval = intervalsRef.current.get(id);
    if (interval) {
      global.clearInterval(interval);
      intervalsRef.current.delete(id);
    }
  }, []);

  const clearAllTimeouts = useCallback((): void => {
    timeoutsRef.current.forEach((timeout) => {
      global.clearTimeout(timeout);
    });
    timeoutsRef.current.clear();
  }, []);

  const clearAllIntervals = useCallback((): void => {
    intervalsRef.current.forEach((interval) => {
      global.clearInterval(interval);
    });
    intervalsRef.current.clear();
  }, []);

  const clearAll = useCallback((): void => {
    clearAllTimeouts();
    clearAllIntervals();
  }, [clearAllTimeouts, clearAllIntervals]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  return {
    setTimeout,
    setInterval,
    clearTimeout: clearTimeoutById,
    clearInterval: clearIntervalById,
    clearAll,
    clearAllTimeouts,
    clearAllIntervals,
  };
}

/**
 * Enhanced debounce hook with automatic cleanup
 * @param func
 * @param delay
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): T {
  const timerManager = useTimerManager();
  const funcRef = useRef(func);
  const timeoutIdRef = useRef<string | null>(null);

  // Update function reference
  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutIdRef.current) {
        timerManager.clearTimeout(timeoutIdRef.current);
      }

      // Set new timeout
      timeoutIdRef.current = timerManager.setTimeout(() => {
        funcRef.current(...args);
        timeoutIdRef.current = null;
      }, delay);
    },
    [delay, timerManager],
  ) as T;

  return debouncedFunction;
}

/**
 * Enhanced throttle hook with automatic cleanup
 * @param func
 * @param delay
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): T {
  const timerManager = useTimerManager();
  const funcRef = useRef(func);
  const lastCallTimeRef = useRef<number>(0);
  const timeoutIdRef = useRef<string | null>(null);

  // Update function reference
  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  const throttledFunction = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTimeRef.current;

      if (timeSinceLastCall >= delay) {
        // Can call immediately
        funcRef.current(...args);
        lastCallTimeRef.current = now;
      } else {
        // Schedule for later
        if (timeoutIdRef.current) {
          timerManager.clearTimeout(timeoutIdRef.current);
        }

        const remainingTime = delay - timeSinceLastCall;
        timeoutIdRef.current = timerManager.setTimeout(() => {
          funcRef.current(...args);
          lastCallTimeRef.current = Date.now();
          timeoutIdRef.current = null;
        }, remainingTime);
      }
    },
    [delay, timerManager],
  ) as T;

  return throttledFunction;
}

/**
 * Animation frame management hook with cleanup
 */
export function useAnimationFrame() {
  const frameIdRef = useRef<number | null>(null);

  const requestFrame = useCallback((callback: () => void): number => {
    // Cancel existing frame
    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current);
    }

    frameIdRef.current = requestAnimationFrame(callback);
    return frameIdRef.current;
  }, []);

  const cancelFrame = useCallback((): void => {
    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelFrame();
    };
  }, [cancelFrame]);

  return {
    requestFrame,
    cancelFrame,
  };
}
