/**
 * Shared utilities for React hooks to reduce code duplication and improve performance
 *
 * This module provides common hook utilities for:
 * - SSR-safe operations
 * - Component lifecycle management
 * - localStorage with error handling
 * - Timer and interval management
 * - Performance optimization (debounce, throttle)
 * - Safe DOM manipulation
 * - ID generation
 * - Error handling wrappers
 */

import React, {useRef, useEffect, useCallback} from "react";

/**
 * SSR-safe check for client-side rendering environment
 *
 * @returns {boolean} True if code is running in browser, false on server
 *
 * @example
 * ```tsx
 * if (isClientSide()) {
 *   // Safe to access window, document, localStorage
 *   localStorage.setItem('key', 'value');
 * }
 * ```
 */
export const isClientSide = (): boolean => {
  return typeof window !== "undefined";
};

/**
 * Hook for safely tracking component mount state
 *
 * Prevents state updates on unmounted components by providing a ref
 * that indicates whether the component is currently mounted.
 *
 * @returns {React.MutableRefObject<boolean>} Ref that is true when mounted
 *
 * @example
 * ```tsx
 * const isMountedRef = useMountRef();
 *
 * const fetchData = async () => {
 *   const data = await api.getData();
 *   if (isMountedRef.current) {
 *     setState(data); // Safe - only updates if mounted
 *   }
 * };
 * ```
 */
export function useMountRef() {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}

/**
 * Hook for SSR-safe client-side effects
 *
 * Only runs effects in client environment, preventing SSR errors
 * when accessing browser-only APIs.
 *
 * @param {Function} effect - Effect function to run (can return cleanup)
 * @param {React.DependencyList} deps - Effect dependencies
 *
 * @example
 * ```tsx
 * useClientEffect(() => {
 *   // Safe to use window, document, etc.
 *   const handler = () => console.log(window.innerWidth);
 *   window.addEventListener('resize', handler);
 *   return () => window.removeEventListener('resize', handler);
 * }, []);
 * ```
 */
export function useClientEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
) {
  useEffect(() => {
    if (!isClientSide()) return;
    return effect();
  }, [deps, effect]);
}

/**
 * Hook for managing localStorage with comprehensive error handling
 *
 * Provides safe localStorage operations with:
 * - SSR compatibility
 * - JSON serialization/deserialization
 * - Error logging
 * - Null/undefined value protection
 *
 * @template T - Type of value to store
 * @param {string} key - localStorage key
 * @param {T} defaultValue - Default value if key doesn't exist
 *
 * @returns {object} localStorage operations
 * @property {Function} getValue - Get value from localStorage
 * @property {Function} setValue - Set value in localStorage
 * @property {Function} removeValue - Remove value from localStorage
 *
 * @example
 * ```tsx
 * const { getValue, setValue, removeValue } = useLocalStorage<string>(
 *   'user-theme',
 *   'dark'
 * );
 *
 * // Get value
 * const theme = getValue(); // 'dark' if not set
 *
 * // Set value
 * setValue('light');
 *
 * // Remove value
 * removeValue();
 * ```
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const getValue = useCallback((): T => {
    if (!isClientSide()) return defaultValue;

    try {
      const item = localStorage.getItem(key);
      if (typeof item === "string" && item !== null && item !== "undefined") {
        const parsed = JSON.parse(item) as T;
        return parsed !== null && parsed !== undefined ? parsed : defaultValue;
      }

      return defaultValue;
    } catch (error) {
      console.warn(`Failed to load from localStorage (${key}):`, error);
      return defaultValue;
    }
  }, [key, defaultValue]);

  const setValue = useCallback(
    (value: T): boolean => {
      if (!isClientSide()) return false;

      try {
        if (value === null || value === undefined) {
          console.warn(
            `Attempted to store null/undefined value for key: ${key}`,
          );
          return false;
        }

        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn(`Failed to save to localStorage (${key}):`, error);
        return false;
      }
    },
    [key],
  );

  const removeValue = useCallback((): boolean => {
    if (!isClientSide()) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove from localStorage (${key}):`, error);
      return false;
    }
  }, [key]);

  return {getValue, setValue, removeValue};
}

/**
 * Hook for managing timers with automatic cleanup
 *
 * Provides safe timer management that:
 * - Auto-cleans on unmount
 * - Only executes callbacks if component is mounted
 * - Tracks timers by custom IDs
 * - Prevents duplicate timers with same ID
 *
 * @returns {object} Timer management functions
 * @property {Function} setTimer - Create a named timeout
 * @property {Function} clearTimer - Clear a specific timer
 * @property {Function} clearAllTimers - Clear all timers
 *
 * @example
 * ```tsx
 * const { setTimer, clearTimer, clearAllTimers } = useTimerManager();
 *
 * // Set a timer
 * setTimer('myTimer', () => {
 *   console.log('Executed');
 * }, 1000);
 *
 * // Clear specific timer
 * clearTimer('myTimer');
 *
 * // Clear all timers
 * clearAllTimers();
 * ```
 */
export function useTimerManager() {
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isMountedRef = useMountRef();

  const setTimer = useCallback(
    (id: string, callback: () => void, delay: number) => {
      if (!isMountedRef.current) return;

      const existingTimer = timersRef.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          callback();
        }
        timersRef.current.delete(id);
      }, delay);

      timersRef.current.set(id, timer);
    },
    [isMountedRef],
  );

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {setTimer, clearTimer, clearAllTimers};
}

/**
 * Hook for managing intervals with automatic cleanup
 *
 * Similar to useTimerManager but for setInterval operations.
 * Automatically clears all intervals on unmount.
 *
 * @returns {object} Interval management functions
 * @property {Function} setInterval - Create a named interval
 * @property {Function} clearInterval - Clear a specific interval
 * @property {Function} clearAllIntervals - Clear all intervals
 *
 * @example
 * ```tsx
 * const { setInterval, clearInterval } = useIntervalManager();
 *
 * // Set an interval
 * setInterval('polling', () => {
 *   fetchData();
 * }, 5000);
 *
 * // Clear it
 * clearInterval('polling');
 * ```
 */
export function useIntervalManager() {
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isMountedRef = useMountRef();

  const clearInterval = useCallback((id: string) => {
    const interval = intervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval.toString());
      intervalsRef.current.delete(id);
    }
  }, []);

  const setInterval = useCallback(
    (id: string, callback: () => void, delay: number) => {
      if (!isMountedRef.current) return;

      const existingInterval = intervalsRef.current.get(id);
      if (existingInterval) {
        clearInterval(existingInterval.toString());
      }

      const interval = window.setInterval(() => {
        if (isMountedRef.current) {
          callback();
        }
      }, delay);

      intervalsRef.current.set(id, interval as unknown as NodeJS.Timeout);
    },
    [clearInterval, isMountedRef],
  );

  const clearAllIntervals = useCallback(() => {
    intervalsRef.current.forEach((interval) =>
      clearInterval(interval.toString()),
    );
    intervalsRef.current.clear();
  }, [clearInterval]);

  useEffect(() => {
    return () => {
      clearAllIntervals();
    };
  }, [clearAllIntervals]);

  return {setInterval, clearInterval, clearAllIntervals};
}

/**
 * Debounce utility function with proper cleanup
 *
 * Delays function execution until after wait time has elapsed
 * since the last invocation.
 *
 * @template T - Function type
 * @param {T} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 *
 * @returns {Function} Debounced function
 *
 * @example
 * ```tsx
 * const debouncedSearch = debounce((query: string) => {
 *   api.search(query);
 * }, 300);
 *
 * // Multiple rapid calls
 * debouncedSearch('a');
 * debouncedSearch('ab');
 * debouncedSearch('abc'); // Only this executes after 300ms
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle utility for performance optimization
 *
 * Ensures function is called at most once per delay period.
 * Useful for rate-limiting expensive operations.
 *
 * @template T - Function type
 * @param {T} func - Function to throttle
 * @param {number} delay - Minimum delay between calls in ms
 *
 * @returns {Function} Throttled function
 *
 * @example
 * ```tsx
 * const throttledScroll = throttle(() => {
 *   updateScrollPosition();
 * }, 100);
 *
 * window.addEventListener('scroll', throttledScroll);
 * // Executes at most once every 100ms
 * ```
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Safe DOM manipulation with existence checks and error handling
 *
 * Wraps DOM operations in requestAnimationFrame and try-catch for safety.
 * Only executes in client environment.
 *
 * @param {Function} callback - DOM manipulation function to execute
 *
 * @example
 * ```tsx
 * safeDOMManipulation(() => {
 *   document.body.style.backgroundColor = 'blue';
 *   element.classList.add('active');
 * });
 * ```
 */
export function safeDOMManipulation(callback: () => void) {
  if (!isClientSide()) return;

  try {
    requestAnimationFrame(() => {
      callback();
    });
  } catch (error) {
    console.warn("DOM manipulation failed:", error);
  }
}

/**
 * Generate unique IDs for components and elements
 *
 * Creates unique identifiers with optional prefix.
 * SSR-safe with fallback for server environments.
 *
 * @param {string} [prefix="id"] - Prefix for the generated ID
 *
 * @returns {string} Unique ID string
 *
 * @example
 * ```tsx
 * const elementId = generateId('button'); // 'button_1234567890_abc123'
 * const timerId = generateId('timer');     // 'timer_1234567890_def456'
 * ```
 */
export function generateId(prefix: string = "id"): string {
  if (isClientSide()) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return `${prefix}_${Date.now()}`;
}

/**
 * Error boundary helper wrapper for hook functions
 *
 * Wraps functions in try-catch and returns fallback on error.
 * Logs errors to console for debugging.
 *
 * @template T - Function type
 * @template F - Fallback type (defaults to undefined)
 * @param {T} fn - Function to wrap with error handling
 * @param {F} [fallback] - Value to return if function throws
 *
 * @returns {T} Wrapped function that won't throw errors
 *
 * @example
 * ```tsx
 * const safeOperation = withErrorHandling(() => {
 *   return riskyCalculation();
 * }, 0);
 *
 * const result = safeOperation(); // Returns 0 if error occurs
 * ```
 */
export function withErrorHandling<
  T extends (...args: unknown[]) => unknown,
  F = undefined,
>(fn: T, fallback?: F): (...args: Parameters<T>) => ReturnType<T> | F {
  return (...args: Parameters<T>): ReturnType<T> | F => {
    try {
      return fn(...args) as ReturnType<T>;
    } catch (error) {
      console.error("Hook execution error:", error);
      return fallback as F;
    }
  };
}
