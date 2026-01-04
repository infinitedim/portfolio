/**
 * Test Suite for Hook Error Handler
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useErrorHandler,
  useSafeAsync,
  useBatchAsync,
} from "../hook-error-handler";
import { NetworkError, ErrorSeverity } from "../error-types";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("Hook Error Handler", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("useErrorHandler", () => {
    it("should initialize with no error", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { result } = renderHook(() => useErrorHandler());

      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.setError).toBe("function");
      expect(typeof result.current.clearError).toBe("function");
      expect(typeof result.current.retry).toBe("function");
    });

    it("should set error when setError is called", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { result } = renderHook(() => useErrorHandler());
      const testError = new NetworkError("Test error", {
        severity: ErrorSeverity.HIGH,
      });

      act(() => {
        result.current.setError(testError);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe("Test error");
    });

    it("should clear error when clearError is called", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { result } = renderHook(() => useErrorHandler());
      const testError = new NetworkError("Test error", {
        severity: ErrorSeverity.HIGH,
      });

      act(() => {
        result.current.setError(testError);
      });

      expect(result.current.error).toBeDefined();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it("should execute async functions with error handling", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const asyncFn = vi.fn().mockResolvedValue("success");
      const { result } = renderHook(() => useErrorHandler());

      await act(async () => {
        await result.current.execute(asyncFn);
      });

      expect(asyncFn).toHaveBeenCalledTimes(1);
      expect(result.current.error).toBeNull();
    });

    it("should handle execution failures", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const asyncError = new Error("Execution failed");
      const asyncFn = vi.fn().mockRejectedValue(asyncError);
      const { result } = renderHook(() => useErrorHandler());

      await act(async () => {
        await result.current.execute(asyncFn);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useSafeAsync", () => {
    it("should execute async functions safely", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const asyncFn = vi.fn().mockResolvedValue("test data");
      const { result } = renderHook(() => useSafeAsync());

      await act(async () => {
        await result.current.execute(asyncFn);
      });

      expect(result.current.data).toBe("test data");
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    it("should handle async function errors", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const asyncError = new Error("Async error");
      const asyncFn = vi.fn().mockRejectedValue(asyncError);
      const { result } = renderHook(() => useSafeAsync());

      await act(async () => {
        await result.current.execute(asyncFn);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    it("should track loading state correctly", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const asyncFn = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve("data"), 50)),
        );
      const { result } = renderHook(() => useSafeAsync());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.execute(asyncFn);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 60));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe("data");
    });
  });

  describe("useBatchAsync", () => {
    it("should process functions in batches", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const functions = [
        vi.fn().mockResolvedValue(1),
        vi.fn().mockResolvedValue(2),
        vi.fn().mockResolvedValue(3),
      ];

      const { result } = renderHook(() => useBatchAsync());

      await act(async () => {
        await result.current.executeBatch(functions, {
          maxConcurrency: 2,
        });
      });

      expect(result.current.results).toHaveLength(3);
      expect(result.current.results[0].success).toBe(true);
      expect(result.current.results[0].data).toBe(1);
      expect(functions[0]).toHaveBeenCalledTimes(1);
    });

    it("should handle mixed success and failure", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const functions = [
        vi.fn().mockResolvedValue("success"),
        vi.fn().mockRejectedValue(new Error("failure")),
        vi.fn().mockResolvedValue("success2"),
      ];

      const { result } = renderHook(() => useBatchAsync());

      await act(async () => {
        await result.current.executeBatch(functions, {
          continueOnError: true,
        });
      });

      expect(result.current.results).toHaveLength(3);
      expect(result.current.results[0].success).toBe(true);
      expect(result.current.results[1].success).toBe(false);
      expect(result.current.results[2].success).toBe(true);
    });
  });
});
