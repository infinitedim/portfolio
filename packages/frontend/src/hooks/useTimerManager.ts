import { useRef, useCallback, useEffect, useState } from "react";
import { EnhancedError, ErrorUtils } from "../lib/errors/error-types";

/**
 * Enhanced timer management utility with automatic cleanup and error handling
 *
 * Prevents memory leaks by tracking and cleaning up all timers.
 * Provides comprehensive error handling for timer operations.
 */

/**
 * Timer manager interface with timeout/interval management and error tracking
 * @interface TimerManager
 * @property {Function} setTimeout - Create a timeout with automatic cleanup
 * @property {Function} setInterval - Create an interval with automatic cleanup
 * @property {Function} clearTimeout - Clear a specific timeout by ID
 * @property {Function} clearInterval - Clear a specific interval by ID
 * @property {Function} clearAll - Clear all timers and errors
 * @property {Function} clearAllTimeouts - Clear only timeouts
 * @property {Function} clearAllIntervals - Clear only intervals
 * @property {Function} getErrors - Get array of captured errors
 * @property {Function} clearErrors - Clear all captured errors
 * @property {boolean} hasErrors - Whether any errors exist
 */
export interface TimerManager {
  setTimeout: (callback: () => void, delay: number, id?: string) => string;
  setInterval: (callback: () => void, delay: number, id?: string) => string;
  clearTimeout: (id: string) => void;
  clearInterval: (id: string) => void;
  clearAll: () => void;
  clearAllTimeouts: () => void;
  clearAllIntervals: () => void;
  getErrors: () => EnhancedError[];
  clearErrors: () => void;
  hasErrors: boolean;
}

/**
 * Enhanced timer manager hook with comprehensive error handling and cleanup
 *
 * Provides safe timer management with:
 * - Automatic cleanup on unmount
 * - Error capture and reporting for callbacks
 * - Critical error auto-stop for intervals
 * - ID-based timer management
 * - Visibility change and beforeunload cleanup
 *
 * @returns {TimerManager} Timer management functions and error state
 *
 * @example
 * ```tsx
 * const timerManager = useTimerManager();
 *
 * // Create a timeout
 * const id = timerManager.setTimeout(() => {
 *   console.log('Executed after 1s');
 * }, 1000);
 *
 * // Create an interval
 * const intervalId = timerManager.setInterval(() => {
 *   console.log('Every second');
 * }, 1000);
 *
 * // Clear specific timer
 * timerManager.clearTimeout(id);
 *
 * // Clear all timers
 * timerManager.clearAll();
 *
 * // Check for errors
 * if (timerManager.hasErrors) {
 *   console.log('Errors:', timerManager.getErrors());
 * }
 * ```
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

      const existingTimeout = timeoutsRef.current.get(timerId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const safeCallback = () => {
        try {
          callback();
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

      const existingInterval = intervalsRef.current.get(timerId);
      if (existingInterval) {
        clearInterval(existingInterval);
      }

      const safeCallback = () => {
        try {
          callback();
          setErrors((prev) => {
            const next = new Map(prev);
            next.delete(timerId);
            return next;
          });
        } catch (error) {
          const enhancedError = ErrorUtils.enhance(error as Error);
          setErrors((prev) => new Map(prev).set(timerId, enhancedError));

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
    setErrors(new Map());
  }, [clearAllTimeouts, clearAllIntervals]);

  const getErrors = useCallback((): EnhancedError[] => {
    return Array.from(errors.values());
  }, [errors]);

  const clearErrors = useCallback((): void => {
    setErrors(new Map());
  }, []);

  const hasErrors = errors.size > 0;

  useEffect(() => {
    const currentTimeouts = timeoutsRef.current;
    const currentIntervals = intervalsRef.current;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        currentTimeouts.forEach((timeout) => global.clearTimeout(timeout));
        currentIntervals.forEach((interval) => global.clearInterval(interval));
      }
    };

    const handleBeforeUnload = () => {
      currentTimeouts.forEach((timeout) => global.clearTimeout(timeout));
      currentIntervals.forEach((interval) => global.clearInterval(interval));
      currentTimeouts.clear();
      currentIntervals.clear();
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      currentTimeouts.forEach((timeout) => global.clearTimeout(timeout));
      currentIntervals.forEach((interval) => global.clearInterval(interval));
      currentTimeouts.clear();
      currentIntervals.clear();

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
 * Enhanced debounce hook with automatic cleanup and timer management
 *
 * Delays function execution until after the specified delay has passed
 * without the function being called again.
 *
 * @template T - Function type to debounce
 * @param {T} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 *
 * @returns {T} Debounced version of the function
 *
 * @example
 * ```tsx
 * const debouncedSearch = useDebounce((query: string) => {
 *   performSearch(query);
 * }, 300);
 *
 * // Will only execute once after user stops typing for 300ms
 * debouncedSearch('react');
 * ```
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): T {
  const timerManager = useTimerManager();
  const funcRef = useRef(func);
  const timeoutIdRef = useRef<string | null>(null);

  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutIdRef.current) {
        timerManager.clearTimeout(timeoutIdRef.current);
      }

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
 * Enhanced throttle hook with automatic cleanup and timer management
 *
 * Ensures function is called at most once per specified delay period.
 * Useful for rate-limiting expensive operations like scroll or resize handlers.
 *
 * @template T - Function type to throttle
 * @param {T} func - Function to throttle
 * @param {number} delay - Minimum delay between executions in milliseconds
 *
 * @returns {T} Throttled version of the function
 *
 * @example
 * ```tsx
 * const throttledScroll = useThrottle((e: Event) => {
 *   updateScrollPosition();
 * }, 100);
 *
 * // Will execute at most once every 100ms
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): T {
  const timerManager = useTimerManager();
  const funcRef = useRef(func);
  const lastCallTimeRef = useRef<number>(0);
  const timeoutIdRef = useRef<string | null>(null);

  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  const throttledFunction = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTimeRef.current;

      if (timeSinceLastCall >= delay) {
        funcRef.current(...args);
        lastCallTimeRef.current = now;
      } else {
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
 * Animation frame management hook with automatic cleanup
 *
 * Provides safe requestAnimationFrame usage with automatic cancellation
 * on unmount. Useful for smooth animations and frequent updates.
 *
 * @returns {object} Animation frame management functions
 * @property {Function} requestFrame - Request an animation frame
 * @property {Function} cancelFrame - Cancel the current animation frame
 *
 * @example
 * ```tsx
 * const { requestFrame, cancelFrame } = useAnimationFrame();
 *
 * const animate = () => {
 *   // Animation logic
 *   updatePosition();
 *
 *   // Continue animation
 *   requestFrame(animate);
 * };
 *
 * // Start animation
 * requestFrame(animate);
 *
 * // Stop animation (or happens automatically on unmount)
 * cancelFrame();
 * ```
 */
export function useAnimationFrame() {
  const frameIdRef = useRef<number | null>(null);

  const requestFrame = useCallback((callback: () => void): number => {
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
