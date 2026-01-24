"use client";

import {useState, useEffect, useRef, useMemo} from "react";

/**
 * Custom hook that debounces a value to prevent excessive updates
 *
 * Optimized for performance with:
 * - Stable timer reference to prevent memory leaks
 * - Proper cleanup on unmount and value change
 * - Minimal re-renders
 *
 * @template T - Type of value being debounced
 * @param {T} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {T} The debounced value
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebouncedValue(searchTerm, 300);
 *
 * useEffect(() => {
 *   // Only called after 300ms of no changes
 *   performSearch(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
      timerRef.current = null;
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debounced callbacks with proper implementation
 *
 * Optimized for performance with:
 * - Stable callback reference using ref pattern
 * - Proper cleanup preventing memory leaks
 * - Returns stable debounced function reference
 *
 * @template T - Function type being debounced
 * @param {T} callback - The callback function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {T} The debounced callback function
 *
 * @example
 * ```tsx
 * const handleSearch = useDebouncedCallback((query: string) => {
 *   api.search(query);
 * }, 300);
 *
 * <input onChange={(e) => handleSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300,
): T {
  const callbackRef = useRef<T>(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const debouncedCallback = useMemo(() => {
    const fn = (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
        timerRef.current = null;
      }, delay);
    };
    return fn as T;
  }, [delay]);

  return debouncedCallback;
}
