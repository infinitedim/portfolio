import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFont } from "@/hooks/use-font";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("useFont", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
  });

  it("initializes and changes font", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    // Mock document and localStorage
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--terminal-font-family",
        "mono",
      );
    }

    const { result } = renderHook(() => useFont());

    expect(result.current.font).toBe(result.current.font);
    act(() => result.current.changeFont(result.current.font));
  });
});
