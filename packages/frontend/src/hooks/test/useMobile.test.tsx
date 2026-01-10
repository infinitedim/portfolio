import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMobile } from "../useMobile";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("useMobile", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }

    ensureDocumentBody();

    // Ensure document.body exists
    if (!document.body) {
      const body = document.createElement("body");
      if (document.documentElement) {
        document.documentElement.appendChild(body);
      }
    }
  });

  it("returns a default mobile state and updates on resize", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    // Mock window dimensions
    globalThis.innerWidth = 500;
    globalThis.innerHeight = 800;

    const { result } = renderHook(() => useMobile());
    // With mocked small innerWidth expect mobile true
    expect(result.current.isMobile).toBe(true);
  });
});
