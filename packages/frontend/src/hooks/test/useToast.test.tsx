import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast, toast } from "../useToast";

describe("useToast", () => {
  it("creates and dismisses a toast via manager", () => {
    renderHook(() => useToast());
    act(() => {
      const t = toast({ title: "hi" });
      expect(typeof t.id).toBe("string");
      t.dismiss();
    });
  });
});
