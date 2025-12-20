/**
 * Hook Error Handling Enhancement
 * Provides React hooks for comprehensive error handling with state management
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { EnhancedError, ErrorUtils } from "./error-types";
import { AsyncErrorHandler, AsyncResult } from "./async-error-handler";

/**
 * State object for error handling in React components
 * @property error - Current error if any
 * @property isLoading - Whether an async operation is in progress
 * @property retryCount - Number of retry attempts made
 * @property lastRetryAt - Timestamp of last retry attempt
 */
export interface ErrorState {
  error: EnhancedError | null;
  isLoading: boolean;
  retryCount: number;
  lastRetryAt: Date | null;
}

/**
 * Configuration options for useErrorHandler hook
 * @property maxRetries - Maximum number of retry attempts (default: 3)
 * @property retryDelay - Delay between retries in milliseconds (default: 1000)
 * @property onError - Callback invoked when error occurs
 * @property onRetry - Callback invoked on each retry attempt
 * @property onSuccess - Callback invoked on successful execution
 * @property resetOnSuccess - Whether to reset error state on success (default: true)
 */
export interface UseErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: EnhancedError) => void;
  onRetry?: (error: EnhancedError, attempt: number) => void;
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
}

/**
 * React hook for comprehensive error handling with retry logic
 * Manages error state and provides utilities for executing async operations safely
 * @param options - Configuration options for error handling behavior
 * @returns Object containing error state and execution utilities
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { execute, errorState, retry, clearError } = useErrorHandler({
 *     maxRetries: 3,
 *     onError: (error) => console.error(error)
 *   });
 *
 *   const handleFetch = () => execute(async () => {
 *     const data = await fetchData();
 *     return data;
 *   });
 *
 *   return (
 *     <div>
 *       {errorState.error && <ErrorMessage error={errorState.error} />}
 *       <button onClick={handleFetch}>Fetch Data</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isLoading: false,
    retryCount: 0,
    lastRetryAt: null,
  });

  const asyncHandler = useRef(AsyncErrorHandler.getInstance());
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetry,
    onSuccess,
    resetOnSuccess = true,
  } = options;

  /**
   * Execute an async function with error handling
   */
  const execute = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      setErrorState((prev) => ({ ...prev, isLoading: true }));

      try {
        const result: AsyncResult<T> = await asyncHandler.current.execute(fn, {
          retryConfig: {
            maxRetries,
            baseDelay: retryDelay,
            maxDelay: 30000,
            backoffFactor: 2,
            onRetry: (error, attempt) => {
              const enhancedError = ErrorUtils.enhance(error);
              setErrorState((prev) => ({
                ...prev,
                retryCount: attempt,
                lastRetryAt: new Date(),
                error: enhancedError,
              }));
              onRetry?.(enhancedError, attempt);
            },
          },
          onError: (error) => {
            const enhancedError = ErrorUtils.enhance(error);
            setErrorState((prev) => ({
              ...prev,
              error: enhancedError,
              isLoading: false,
            }));
            onError?.(enhancedError);
          },
          onSuccess: () => {
            if (resetOnSuccess) {
              setErrorState({
                error: null,
                isLoading: false,
                retryCount: 0,
                lastRetryAt: null,
              });
            } else {
              setErrorState((prev) => ({
                ...prev,
                isLoading: false,
              }));
            }
            onSuccess?.();
          },
        });

        if (result.success) {
          return result.data as T;
        } else {
          throw result.error || new Error("Operation failed");
        }
      } catch (error) {
        const enhancedError = ErrorUtils.enhance(error as Error);
        setErrorState((prev) => ({
          ...prev,
          error: enhancedError,
          isLoading: false,
        }));
        return null;
      }
    },
    [maxRetries, retryDelay, onError, onRetry, onSuccess, resetOnSuccess],
  );

  /**
   * Manually set an error
   */
  const setError = useCallback((error: Error | string) => {
    const enhancedError =
      typeof error === "string"
        ? new EnhancedError(error)
        : ErrorUtils.enhance(error);
    setErrorState((prev) => ({
      ...prev,
      error: enhancedError,
      isLoading: false,
    }));
  }, []);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isLoading: false,
      retryCount: 0,
      lastRetryAt: null,
    });
  }, []);

  /**
   * Retry the last failed operation
   */
  const retry = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      if (errorState.retryCount >= maxRetries) {
        return null;
      }
      return execute(fn);
    },
    [execute, errorState.retryCount, maxRetries],
  );

  return {
    ...errorState,
    execute,
    setError,
    clearError,
    retry,
    canRetry:
      errorState.error?.isRetryable && errorState.retryCount < maxRetries,
  };
}

/**
 * Hook for safe async operations that never throw
 */
export function useSafeAsync<T>() {
  const [state, setState] = useState<{
    data: T | null;
    error: EnhancedError | null;
    isLoading: boolean;
  }>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(async (fn: () => Promise<T>) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await fn();
      setState({ data, error: null, isLoading: false });
      return data;
    } catch (error) {
      const enhancedError = ErrorUtils.enhance(error as Error);
      setState({ data: null, error: enhancedError, isLoading: false });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for handling multiple async operations
 */
export function useBatchAsync<T>() {
  const [state, setState] = useState<{
    results: Array<{ success: boolean; data?: T; error?: EnhancedError }>;
    isLoading: boolean;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }>({
    results: [],
    isLoading: false,
    summary: { total: 0, successful: 0, failed: 0 },
  });

  const executeBatch = useCallback(
    async (
      functions: Array<() => Promise<T>>,
      options: { continueOnError?: boolean; maxConcurrency?: number } = {},
    ) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { continueOnError = true, maxConcurrency = 3 } = options;
      const results: Array<{
        success: boolean;
        data?: T;
        error?: EnhancedError;
      }> = [];

      for (let i = 0; i < functions.length; i += maxConcurrency) {
        const batch = functions.slice(i, i + maxConcurrency);
        const batchPromises = batch.map(async (fn) => {
          try {
            const data = await fn();
            return { success: true, data };
          } catch (error) {
            const enhancedError = ErrorUtils.enhance(error as Error);
            if (!continueOnError) {
              throw enhancedError;
            }
            return { success: false, error: enhancedError };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      const summary = {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      };

      setState({
        results,
        isLoading: false,
        summary,
      });

      return { results, summary };
    },
    [],
  );

  const reset = useCallback(() => {
    setState({
      results: [],
      isLoading: false,
      summary: { total: 0, successful: 0, failed: 0 },
    });
  }, []);

  return {
    ...state,
    executeBatch,
    reset,
  };
}

/**
 * Hook for timer-based operations with error handling
 */
export function useTimerWithErrorHandling() {
  const [state, setState] = useState<{
    isRunning: boolean;
    error: EnhancedError | null;
    lastExecuted: Date | null;
  }>({
    isRunning: false,
    error: null,
    lastExecuted: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startInterval = useCallback(
    (fn: () => Promise<void> | void, delay: number) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      setState((prev) => ({ ...prev, isRunning: true, error: null }));

      intervalRef.current = setInterval(async () => {
        try {
          await fn();
          setState((prev) => ({
            ...prev,
            lastExecuted: new Date(),
            error: null,
          }));
        } catch (error) {
          const enhancedError = ErrorUtils.enhance(error as Error);
          setState((prev) => ({
            ...prev,
            error: enhancedError,
            isRunning: false,
          }));
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, delay);
    },
    [],
  );

  const startTimeout = useCallback(
    (fn: () => Promise<void> | void, delay: number) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setState((prev) => ({ ...prev, isRunning: true, error: null }));

      timeoutRef.current = setTimeout(async () => {
        try {
          await fn();
          setState((prev) => ({
            ...prev,
            lastExecuted: new Date(),
            error: null,
            isRunning: false,
          }));
        } catch (error) {
          const enhancedError = ErrorUtils.enhance(error as Error);
          setState((prev) => ({
            ...prev,
            error: enhancedError,
            isRunning: false,
          }));
        }
        timeoutRef.current = null;
      }, delay);
    },
    [],
  );

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    ...state,
    startInterval,
    startTimeout,
    stop,
    clearError,
  };
}

/**
 * Enhanced version of useTimerManager with error handling
 */
export function useEnhancedTimerManager() {
  const [errors, setErrors] = useState<Map<string, EnhancedError>>(new Map());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const idCounterRef = useRef(0);

  const generateId = useCallback((): string => {
    idCounterRef.current += 1;
    return `timer_${Date.now()}_${idCounterRef.current}`;
  }, []);

  const setTimeoutSafe = useCallback(
    (
      callback: () => Promise<void> | void,
      delay: number,
      id?: string,
    ): string => {
      const timerId = id || generateId();

      const existingTimeout = timeoutsRef.current.get(timerId);
      if (existingTimeout) {
        global.clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(async () => {
        try {
          await callback();
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
      }, delay);

      timeoutsRef.current.set(timerId, timeout);
      return timerId;
    },
    [generateId],
  );

  const setIntervalSafe = useCallback(
    (
      callback: () => Promise<void> | void,
      delay: number,
      id?: string,
    ): string => {
      const timerId = id || generateId();

      const existingInterval = intervalsRef.current.get(timerId);
      if (existingInterval) {
        global.clearInterval(existingInterval);
      }

      const interval = setInterval(async () => {
        try {
          await callback();
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
      }, delay);

      intervalsRef.current.set(timerId, interval);
      return timerId;
    },
    [generateId],
  );

  const clearTimeout = useCallback((id: string): void => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      global.clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearInterval = useCallback((id: string): void => {
    const interval = intervalsRef.current.get(id);
    if (interval) {
      global.clearInterval(interval);
      intervalsRef.current.delete(id);
    }
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearAll = useCallback((): void => {
    timeoutsRef.current.forEach((timeout) => global.clearTimeout(timeout));
    intervalsRef.current.forEach((interval) => global.clearInterval(interval));
    timeoutsRef.current.clear();
    intervalsRef.current.clear();
    setErrors(new Map());
  }, []);

  const getErrors = useCallback(() => {
    return Array.from(errors.values());
  }, [errors]);

  const hasErrors = errors.size > 0;

  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  return {
    setTimeout: setTimeoutSafe,
    setInterval: setIntervalSafe,
    clearTimeout,
    clearInterval,
    clearAll,
    errors: getErrors(),
    hasErrors,
  };
}
