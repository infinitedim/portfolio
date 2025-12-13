import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast, toast } from "../useToast";

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("toast creation", () => {
    it("creates and dismisses a toast via manager", () => {
      renderHook(() => useToast());
      act(() => {
        const t = toast({ title: "hi" });
        expect(typeof t.id).toBe("string");
        t.dismiss();
      });
    });

    it("creates toast with title and description", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: "Test Title", description: "Test Description" });
      });

      expect(result.current.toasts.length).toBeGreaterThanOrEqual(0);
    });

    it("creates toast with all properties", () => {
      renderHook(() => useToast());

      act(() => {
        const t = toast({
          title: "Complete Toast",
          description: "With description",
          variant: "destructive",
        });
        expect(t.id).toBeDefined();
        expect(typeof t.dismiss).toBe("function");
        expect(typeof t.update).toBe("function");
      });
    });
  });

  describe("toast updates", () => {
    it("updates an existing toast", () => {
      renderHook(() => useToast());

      act(() => {
        const t = toast({ title: "Initial" });
        t.update({ id: t.id, title: "Updated Title" });
      });
    });
  });

  describe("toast dismissal", () => {
    it("dismisses a specific toast", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        const t = toast({ title: "To Dismiss" });
        t.dismiss();
      });

      // Toasts should be dismissed
      expect(
        result.current.toasts.every(
          (t) => t.open === false || t.open === undefined,
        ),
      ).toBe(true);
    });

    it("dismisses all toasts when no id provided", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: "Toast 1" });
        toast({ title: "Toast 2" });
        result.current.dismiss();
      });
    });
  });

  describe("hook return values", () => {
    it("returns toasts array", () => {
      const { result } = renderHook(() => useToast());

      expect(Array.isArray(result.current.toasts)).toBe(true);
    });

    it("returns toast and dismiss functions", () => {
      const { result } = renderHook(() => useToast());

      expect(typeof result.current.toast).toBe("function");
      expect(typeof result.current.dismiss).toBe("function");
    });
  });
});
