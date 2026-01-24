/**
 * Test Suite for Async Error Handler
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AsyncErrorHandler, AsyncUtils } from "../async-error-handler";
import { NetworkError, ErrorSeverity } from "../error-types";

describe("Async Error Handler", () => {
  let handler: AsyncErrorHandler;

  beforeEach(() => {
    handler = AsyncErrorHandler.getInstance();
    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should execute successful functions", async () => {
      const successFn = vi.fn().mockResolvedValue("success");
      const onSuccess = vi.fn();

      const result = await handler.execute(successFn, { onSuccess });

      expect(result.success).toBe(true);
      expect(result.data).toBe("success");
      expect(result.retryCount).toBe(0);
      expect(onSuccess).toHaveBeenCalledWith("success");
    });

    it("should handle errors and retry retryable errors", async () => {
      const error = new NetworkError("Connection failed");
      const failFn = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();
      const onRetry = vi.fn();

      const result = await handler.execute(failFn, {
        retryConfig: {
          maxRetries: 2,
          baseDelay: 10,
          maxDelay: 1000,
          backoffFactor: 2,
          onRetry,
        },
        onError,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(NetworkError);
      expect(result.retryCount).toBe(2);
      expect(failFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it("should respect timeout configuration", async () => {
      // Create a function that takes longer than the timeout
      const slowFn = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve("delayed"), 200);
          }),
      );

      // Use a short timeout and disable retries to prevent retry delays
      const result = await handler.execute(slowFn, {
        timeout: 50,
        retryConfig: {
          maxRetries: 0,
          baseDelay: 100,
          maxDelay: 1000,
          backoffFactor: 2,
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("timed out");
    });

    it("should not retry non-retryable errors", async () => {
      const error = new Error("Non-retryable error");
      const failFn = vi.fn().mockRejectedValue(error);

      const result = await handler.execute(failFn, {
        retryConfig: {
          maxRetries: 3,
          baseDelay: 10,
          maxDelay: 1000,
          backoffFactor: 2,
          retryCondition: () => false,
        },
      });

      expect(result.success).toBe(false);
      expect(result.retryCount).toBe(0);
      expect(failFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("executeAll", () => {
    it("should execute all functions successfully", async () => {
      const fn1 = vi.fn().mockResolvedValue("result1");
      const fn2 = vi.fn().mockResolvedValue("result2");
      const fn3 = vi.fn().mockResolvedValue("result3");

      const result = await handler.executeAll([fn1, fn2, fn3]);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(["result1", "result2", "result3"]);
    });

    it("should handle mixed success and failure", async () => {
      const successFn = vi.fn().mockResolvedValue("success");
      const errorFn = vi.fn().mockRejectedValue(new Error("Failed"));

      const result = await handler.executeAll([successFn, errorFn], {
        failFast: false,
      });

      expect(result.success).toBe(false);
      expect(result.data).toEqual(["success"]);
      expect(result.error).toBeDefined();
    });

    it("should fail fast when configured", async () => {
      const successFn = vi.fn().mockResolvedValue("success");
      const errorFn = vi.fn().mockRejectedValue(new Error("Failed"));
      const neverCalledFn = vi.fn().mockResolvedValue("never");

      const result = await handler.executeAll(
        [successFn, errorFn, neverCalledFn],
        {
          failFast: true,
        },
      );

      expect(result.success).toBe(false);
      expect(neverCalledFn).not.toHaveBeenCalled();
    });
  });
});

describe("AsyncUtils", () => {
  describe("safe", () => {
    it("should return data on success", async () => {
      const successFn = vi.fn().mockResolvedValue("success");

      const result = await AsyncUtils.safe(successFn);

      expect(result.data).toBe("success");
      expect(result.error).toBeUndefined();
    });

    it("should return error on failure", async () => {
      const error = new Error("Failed");
      const errorFn = vi.fn().mockRejectedValue(error);

      const result = await AsyncUtils.safe(errorFn, "fallback");

      expect(result.data).toBe("fallback");
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Failed");
    });
  });

  describe("retry", () => {
    it("should retry and eventually succeed", async () => {
      let attempts = 0;
      const retryFn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new NetworkError("Not ready yet", {
            isRetryable: true,
            severity: ErrorSeverity.MEDIUM,
          });
        }
        return "success";
      });

      const result = await AsyncUtils.retry(retryFn, {
        maxRetries: 3,
        baseDelay: 1, // Use minimal delay for faster tests
        maxDelay: 5,
      });

      expect(result).toBe("success");
      expect(retryFn).toHaveBeenCalledTimes(3);
    });

    it("should throw after max retries", async () => {
      const errorFn = vi.fn().mockImplementation(() => {
        throw new NetworkError("Always fails", {
          isRetryable: true,
          severity: ErrorSeverity.HIGH,
        });
      });

      await expect(
        AsyncUtils.retry(errorFn, { maxRetries: 2, baseDelay: 1, maxDelay: 5 }),
      ).rejects.toThrow();

      expect(errorFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe("createCircuitBreaker", () => {
    it("should allow requests when circuit is closed", async () => {
      const successFn = vi.fn().mockResolvedValue("success");
      const circuitBreaker = AsyncUtils.createCircuitBreaker(successFn, {
        failureThreshold: 3,
        resetTimeout: 100,
        monitoringPeriod: 1000,
      });

      const result = await circuitBreaker();
      expect(result).toBe("success");
    });

    it("should open circuit after threshold failures", async () => {
      const errorFn = vi.fn().mockRejectedValue(new Error("Service down"));
      const circuitBreaker = AsyncUtils.createCircuitBreaker(errorFn, {
        failureThreshold: 2,
        resetTimeout: 100,
        monitoringPeriod: 1000,
      });

      // Cause enough failures to open circuit
      await expect(circuitBreaker()).rejects.toThrow("Service down");
      await expect(circuitBreaker()).rejects.toThrow("Service down");

      // Circuit should now be open
      await expect(circuitBreaker()).rejects.toThrow("Circuit breaker is OPEN");
    });
  });

  describe("processBatch", () => {
    it("should process all items successfully", async () => {
      const items = [1, 2, 3];
      const processor = vi
        .fn()
        .mockImplementation((item: number) => Promise.resolve(item * 2));

      const result = await AsyncUtils.processBatch(items, processor);

      expect(result.summary.successful).toBe(3);
      expect(result.summary.failed).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(result.results[0].data).toBe(2);
      expect(result.results[1].data).toBe(4);
      expect(result.results[2].data).toBe(6);
    });

    it("should handle partial failures", async () => {
      const items = [1, 2, 3];
      const processor = vi.fn().mockImplementation((item: number) => {
        if (item === 2) {
          throw new Error("Processing failed for item 2");
        }
        return Promise.resolve(item * 2);
      });

      const result = await AsyncUtils.processBatch(items, processor, {
        continueOnError: true,
      });

      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(1);
      expect(result.summary.errors).toHaveLength(1);
    });

    it("should respect batch size and concurrency limits", async () => {
      const items = Array.from({ length: 10 }, (_, i) => i);
      const processor = vi
        .fn()
        .mockImplementation((item: number) => Promise.resolve(item));

      await AsyncUtils.processBatch(items, processor, {
        batchSize: 3,
        concurrency: 2,
      });

      expect(processor).toHaveBeenCalledTimes(10);
    });
  });
});
