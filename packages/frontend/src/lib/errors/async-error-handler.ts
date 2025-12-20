/**
 * Async Error Handling Utilities
 * Provides comprehensive async/await error handling with retry logic and recovery strategies
 */

import {
  EnhancedError,
  ErrorCategory,
  ErrorSeverity,
  NetworkError,
  ErrorUtils,
} from "./error-types";

/**
 * Configuration for retry behavior in async operations
 * @property maxRetries - Maximum number of retry attempts
 * @property baseDelay - Initial delay between retries in milliseconds
 * @property maxDelay - Maximum delay between retries in milliseconds
 * @property backoffFactor - Multiplier for exponential backoff (delay *= backoffFactor)
 * @property retryCondition - Optional function to determine if error should be retried
 * @property onRetry - Optional callback invoked on each retry attempt
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Configuration for async error handler
 * @property timeout - Optional timeout in milliseconds for the operation
 * @property retryConfig - Optional retry configuration
 * @property fallbackValue - Optional fallback value to return on failure
 * @property onError - Optional callback invoked when error occurs
 * @property onSuccess - Optional callback invoked on successful execution
 */
export interface AsyncErrorHandlerConfig {
  timeout?: number;
  retryConfig?: RetryConfig;
  fallbackValue?: unknown;
  onError?: (error: Error) => void;
  onSuccess?: (result: unknown) => void;
}

/**
 * Result of an async operation with error handling
 * @property success - Whether the operation succeeded
 * @property data - Result data if successful
 * @property error - Enhanced error if operation failed
 * @property retryCount - Number of retry attempts made
 * @property duration - Total duration of operation in milliseconds
 */
export interface AsyncResult<T> {
  success: boolean;
  data?: T;
  error?: EnhancedError;
  retryCount: number;
  duration: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: Error) => ErrorUtils.isRetryable(error),
};

/**
 * Enhanced async error handler with retry logic and comprehensive error management
 * Implements singleton pattern for consistent error handling across the application
 * @example
 * ```ts
 * const handler = AsyncErrorHandler.getInstance();
 * const result = await handler.execute(() => fetchData(), {
 *   retryConfig: { maxRetries: 3 },
 *   timeout: 5000
 * });
 * ```
 */
export class AsyncErrorHandler {
  private static instance: AsyncErrorHandler;

  /**
   * Gets the singleton instance of AsyncErrorHandler
   * @returns The singleton handler instance
   */
  static getInstance(): AsyncErrorHandler {
    if (!AsyncErrorHandler.instance) {
      AsyncErrorHandler.instance = new AsyncErrorHandler();
    }
    return AsyncErrorHandler.instance;
  }

  /**
   * Execute an async function with comprehensive error handling
   */
  async execute<T>(
    fn: () => Promise<T>,
    config: AsyncErrorHandlerConfig = {},
  ): Promise<AsyncResult<T>> {
    const startTime = Date.now();
    let retryCount = 0;
    let lastError: EnhancedError | undefined;

    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retryConfig };

    while (retryCount <= retryConfig.maxRetries) {
      try {
        const result = config.timeout
          ? await this.withTimeout(fn(), config.timeout)
          : await fn();

        const duration = Date.now() - startTime;

        config.onSuccess?.(result);

        return {
          success: true,
          data: result,
          retryCount,
          duration,
        };
      } catch (error) {
        const enhancedError = ErrorUtils.enhance(error as Error);
        lastError = enhancedError;

        config.onError?.(enhancedError);

        const shouldRetry =
          retryCount < retryConfig.maxRetries &&
          (retryConfig.retryCondition?.(enhancedError, retryCount) ??
            enhancedError.isRetryable);

        if (!shouldRetry) {
          break;
        }

        retryCount++;

        retryConfig.onRetry?.(enhancedError, retryCount - 1);

        const delay = Math.min(
          retryConfig.baseDelay *
            Math.pow(retryConfig.backoffFactor, retryCount - 1),
          retryConfig.maxDelay,
        );

        await this.delay(delay);
      }
    }

    const duration = Date.now() - startTime;

    return {
      success: false,
      error: lastError,
      retryCount,
      duration,
    };
  }

  /**
   * Execute multiple async functions with error handling
   */
  async executeAll<T>(
    functions: Array<() => Promise<T>>,
    config: AsyncErrorHandlerConfig & { failFast?: boolean } = {},
  ): Promise<AsyncResult<T[]>> {
    const results: AsyncResult<T>[] = [];
    const successfulResults: T[] = [];
    const errors: EnhancedError[] = [];
    let totalRetryCount = 0;
    const startTime = Date.now();

    for (const fn of functions) {
      const result = await this.execute(fn, config);
      results.push(result);
      totalRetryCount += result.retryCount;

      if (result.success) {
        successfulResults.push(result.data as T);
      } else {
        if (result.error) {
          errors.push(result.error);
        }

        if (config.failFast) {
          break;
        }
      }
    }

    const duration = Date.now() - startTime;
    const hasErrors = errors.length > 0;

    if (hasErrors && config.failFast) {
      return {
        success: false,
        error: errors[0],
        retryCount: totalRetryCount,
        duration,
      };
    }

    return {
      success: !hasErrors,
      data: successfulResults,
      error: hasErrors ? this.combineErrors(errors) : undefined,
      retryCount: totalRetryCount,
      duration,
    };
  }

  /**
   * Execute with timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeout: number,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((resolve, reject) => {
      setTimeout(() => {
        reject(
          new NetworkError(`Operation timed out after ${timeout}ms`, {
            severity: ErrorSeverity.HIGH,
            suggestions: [
              "Try again with a longer timeout",
              "Check your internet connection",
              "Contact support if the problem persists",
            ],
          }),
        );
      }, timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Delay utility for retry logic
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Combine multiple errors into a single error
   */
  private combineErrors(errors: EnhancedError[]): EnhancedError {
    const messages = errors.map((e) => e.message).join("; ");
    const categories = [...new Set(errors.map((e) => e.category))];
    const maxSeverity = errors.reduce((max, e) => {
      const severityOrder = [
        ErrorSeverity.LOW,
        ErrorSeverity.MEDIUM,
        ErrorSeverity.HIGH,
        ErrorSeverity.CRITICAL,
      ];
      return severityOrder.indexOf(e.severity) > severityOrder.indexOf(max)
        ? e.severity
        : max;
    }, ErrorSeverity.LOW);

    return new EnhancedError(`Multiple errors occurred: ${messages}`, {
      category: categories.length === 1 ? categories[0] : ErrorCategory.UNKNOWN,
      severity: maxSeverity,
      isRetryable: errors.some((e) => e.isRetryable),
      suggestions: [
        "Multiple issues were encountered",
        "Try addressing each issue individually",
        "Contact support if problems persist",
      ],
    });
  }
}

/**
 * Utility functions for common async error handling patterns
 */
export class AsyncUtils {
  /**
   * Safe async wrapper that never throws
   */
  static async safe<T>(
    fn: () => Promise<T>,
    fallbackValue?: T,
  ): Promise<{ data?: T; error?: EnhancedError }> {
    try {
      const data = await fn();
      return { data };
    } catch (error) {
      return {
        data: fallbackValue,
        error: ErrorUtils.enhance(error as Error),
      };
    }
  }

  /**
   * Retry a function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
  ): Promise<T> {
    const handler = AsyncErrorHandler.getInstance();
    const mergedConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    const result = await handler.execute(fn, { retryConfig: mergedConfig });

    if (result.success) {
      return result.data as T;
    }

    throw result.error || new Error("Retry failed");
  }

  /**
   * Execute with a circuit breaker pattern
   */
  static createCircuitBreaker<T>(
    fn: () => Promise<T>,
    config: {
      failureThreshold: number;
      resetTimeout: number;
      monitoringPeriod: number;
    } = {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 60000,
    },
  ) {
    let failures = 0;
    let lastFailureTime = 0;
    let state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

    return async (): Promise<T> => {
      const now = Date.now();

      if (now - lastFailureTime > config.monitoringPeriod) {
        failures = 0;
      }

      if (state === "OPEN") {
        if (now - lastFailureTime > config.resetTimeout) {
          state = "HALF_OPEN";
        } else {
          throw new NetworkError("Circuit breaker is OPEN", {
            severity: ErrorSeverity.HIGH,
            suggestions: [
              "Service is temporarily unavailable",
              "Try again later",
              "Contact support if the issue persists",
            ],
          });
        }
      }

      try {
        const result = await fn();

        if (state === "HALF_OPEN") {
          state = "CLOSED";
          failures = 0;
        }

        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;

        if (failures >= config.failureThreshold) {
          state = "OPEN";
        }

        throw error;
      }
    };
  }

  /**
   * Batch process with error handling
   */
  static async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: {
      batchSize?: number;
      concurrency?: number;
      continueOnError?: boolean;
    } = {},
  ): Promise<{
    results: Array<{
      success: boolean;
      data?: R;
      error?: EnhancedError;
      item: T;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      errors: EnhancedError[];
    };
  }> {
    const { batchSize = 10, concurrency = 3, continueOnError = true } = options;
    const results: Array<{
      success: boolean;
      data?: R;
      error?: EnhancedError;
      item: T;
    }> = [];
    const errors: EnhancedError[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const batchPromises = batch.map(async (item) => {
        const { data, error } = await AsyncUtils.safe(() => processor(item));

        const result = {
          success: !error,
          data,
          error,
          item,
        };

        if (error) {
          errors.push(error);

          if (!continueOnError) {
            throw error;
          }
        }

        return result;
      });

      const batchResults = await Promise.all(
        batchPromises.slice(0, concurrency),
      );
      results.push(...batchResults);

      if (batch.length > concurrency) {
        const remainingPromises = batchPromises.slice(concurrency);
        const remainingResults = await Promise.all(remainingPromises);
        results.push(...remainingResults);
      }
    }

    return {
      results,
      summary: {
        total: items.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        errors,
      },
    };
  }
}

/**
 * Decorator for automatic error handling
 */
export function handleAsync(config?: AsyncErrorHandlerConfig) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const handler = AsyncErrorHandler.getInstance();
      const result = await handler.execute(
        () => originalMethod.apply(this, args),
        config,
      );

      if (result.success) {
        return result.data;
      }

      throw result.error;
    };

    return descriptor;
  };
}

/**
 * Hook wrapper for async operations
 */
export function useAsyncErrorHandler() {
  const handler = AsyncErrorHandler.getInstance();

  return {
    execute: handler.execute.bind(handler),
    executeAll: handler.executeAll.bind(handler),
    safe: AsyncUtils.safe,
    retry: AsyncUtils.retry,
    processBatch: AsyncUtils.processBatch,
  };
}
