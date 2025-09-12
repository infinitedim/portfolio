/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Shared utilities for React hooks to reduce code duplication and improve performance
 */

import React, { useRef, useEffect, useCallback } from "react";

/**
 * SSR-safe check for client-side rendering
 * @returns {boolean} True if the code is running on the client side, false otherwise
 */
export const isClientSide = (): boolean => {
  return typeof window !== "undefined";
};

/**
 * Hook for managing component mount state safely
 * @returns {React.MutableRefObject<boolean>} A ref that tracks the component's mount state
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
 * @param {Function} effect - The effect to run
 * @param {React.DependencyList} deps - The dependencies to watch
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
 * Hook for managing localStorage with error handling
 * @param {string} key - The key to store the value
 * @param {T} defaultValue - The default value to return if the key is not found
 * @returns {object} An object with getValue, setValue, and removeValue methods
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
        // Validate value before storing
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

  return { getValue, setValue, removeValue };
}

/**
 * Hook for managing timers with automatic cleanup
 * @returns {object} An object with setTimer, clearTimer, and clearAllTimers methods
 */
export function useTimerManager() {
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isMountedRef = useMountRef();

  const setTimer = useCallback(
    (id: string, callback: () => void, delay: number) => {
      if (!isMountedRef.current) return;

      // Clear existing timer with same id
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return { setTimer, clearTimer, clearAllTimers };
}

/**
 * Hook for managing intervals with automatic cleanup
 * @returns {object} An object with setInterval, clearInterval, and clearAllIntervals methods
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

      // Clear existing interval with same id
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllIntervals();
    };
  }, [clearAllIntervals]);

  return { setInterval, clearInterval, clearAllIntervals };
}

/**
 * Debounce utility with proper cleanup
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} The debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
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
 * @param {Function} func - The function to throttle
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} The throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
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
 * Safe DOM manipulation with existence checks
 * @param {Function} callback - The callback to execute
 */
export function safeDOMManipulation(callback: () => void) {
  if (!isClientSide()) return;

  try {
    // Wait for next tick to ensure DOM is ready
    requestAnimationFrame(() => {
      callback();
    });
  } catch (error) {
    console.warn("DOM manipulation failed:", error);
  }
}

/**
 * Generate unique IDs for components
 * @param {string} prefix - The prefix to use for the ID
 * @returns {string} The generated ID
 */
export function generateId(prefix: string = "id"): string {
  if (isClientSide()) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return `${prefix}_${Date.now()}`;
}

/**
 * Error boundary helper for hooks
 * @param {Function} fn - The function to execute
 * @param {any} fallback - The fallback value to return if the function throws an error
 * @returns {Function} The wrapped function
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  fallback?: any,
): T {
  return ((...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      console.error("Hook execution error:", error);
      return fallback;
    }
  }) as T;
}
