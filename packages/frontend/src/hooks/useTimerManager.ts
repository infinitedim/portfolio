import { useRef, useCallback, useEffect, useState } from "react";
import { EnhancedError, ErrorUtils } from "../lib/errors/error-types";

/**
 * Enhanced timer management utility with automatic cleanup and error handling
 * Prevents memory leaks by tracking and cleaning up all timers
 * Provides comprehensive error handling for timer operations
 */

interface TimerManager {
  setTimeout: (callback: () => void, delay: number, id?: string) => string;
  setInterval: (callback: () => void, delay: number, id?: string) => string;
  clearTimeout: (id: string) => void;
  clearInterval: (id: string) => void;
  clearAll: () => void;
  clearAllTimeouts: () => void;
  clearAllIntervals: () => void;
  // Error handling additions
  getErrors: () => EnhancedError[];
  clearErrors: () => void;
  hasErrors: boolean;
}

/**
 * Enhanced timer manager with error handling
 */
export function useTimerManager(): TimerManager {
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const idCounterRef = useRef(0);
  const [errors, setErrors] = useState<Map<string, EnhancedError>>(new Map());

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

      const safeCallback = () => {
        try {
          callback();
          // Clear any previous errors for this timer
          setErrors((prev) => {
            const next = new Map(prev);
            next.delete(timerId);
            return next;
          });
        } catch (error) {
          const enhancedError = ErrorUtils.enhance(error as Error);
          setErrors((prev) => new Map(prev).set(timerId, enhancedError));
        } finally {
          timeoutsRef.current.delete(timerId);
        }
      };

      const timeout = global.setTimeout(safeCallback, delay);

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

      const safeCallback = () => {
        try {
          callback();
          // Clear any previous errors for this timer
          setErrors((prev) => {
            const next = new Map(prev);
            next.delete(timerId);
            return next;
          });
        } catch (error) {
          const enhancedError = ErrorUtils.enhance(error as Error);
          setErrors((prev) => new Map(prev).set(timerId, enhancedError));

          // Optionally stop interval on critical error
          if (enhancedError.severity === "CRITICAL") {
            const intervalToStop = intervalsRef.current.get(timerId);
            if (intervalToStop) {
              global.clearInterval(intervalToStop);
              intervalsRef.current.delete(timerId);
            }
          }
        }
      };

      const interval = global.setInterval(safeCallback, delay);
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
    setErrors(new Map()); // Clear all errors too
  }, [clearAllTimeouts, clearAllIntervals]);

  // Error handling methods
  const getErrors = useCallback((): EnhancedError[] => {
    return Array.from(errors.values());
  }, [errors]);

  const clearErrors = useCallback((): void => {
    setErrors(new Map());
  }, []);

  const hasErrors = errors.size > 0;

  // Enhanced cleanup with memory leak prevention
  useEffect(() => {
    // Store current refs for cleanup
    const currentTimeouts = timeoutsRef.current;
    const currentIntervals = intervalsRef.current;

    // Handle page visibility changes to clear timers when hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Clear all timers when page becomes hidden to save resources
        currentTimeouts.forEach((timeout) => global.clearTimeout(timeout));
        currentIntervals.forEach((interval) => global.clearInterval(interval));
      }
    };

    // Handle page unload to ensure cleanup
    const handleBeforeUnload = () => {
      currentTimeouts.forEach((timeout) => global.clearTimeout(timeout));
      currentIntervals.forEach((interval) => global.clearInterval(interval));
      currentTimeouts.clear();
      currentIntervals.clear();
    };

    // Add event listeners for comprehensive cleanup
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    // Cleanup all timers on unmount
    return () => {
      // Clear all timers
      currentTimeouts.forEach((timeout) => global.clearTimeout(timeout));
      currentIntervals.forEach((interval) => global.clearInterval(interval));
      currentTimeouts.clear();
      currentIntervals.clear();

      // Remove event listeners
      if (typeof document !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        window.removeEventListener("beforeunload", handleBeforeUnload);
      }
    };
  }, []);

  return {
    setTimeout,
    setInterval,
    clearTimeout: clearTimeoutById,
    clearInterval: clearIntervalById,
    clearAll,
    clearAllTimeouts,
    clearAllIntervals,
    getErrors,
    clearErrors,
    hasErrors,
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
