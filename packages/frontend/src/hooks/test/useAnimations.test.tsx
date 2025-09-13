import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock accessibility provider used by the hook
vi.mock(
  "@portfolio/frontend/src/components/accessibility/AccessibilityProvider",
  () => ({
    useAccessibility: () => ({ isReducedMotion: false }),
  }),
);

import { useAnimations, useTerminalAnimations } from "../useAnimations";

describe("useAnimations", () => {
  it("typewriter effect writes text when not reduced motion", async () => {
    const { result } = renderHook(() => useAnimations());
    const el = document.createElement("div");

    await act(async () => {
      await result.current.createTypewriterEffect(el, "hello", {
        speed: 1,
        cursor: false,
      });
    });

    expect(el.textContent).toBe("hello");
  });

  it("loading dots cleanup clears container", () => {
    const { result } = renderHook(() => useAnimations());
    const container = document.createElement("div");
    const cleanup = result.current.createLoadingDots(container, 3);
    expect(container.children.length).toBeGreaterThan(0);
    cleanup();
    expect(container.children.length).toBe(0);
  });

  it("terminal animations expose isTyping state", async () => {
    const { result } = renderHook(() => useTerminalAnimations());
    const el = document.createElement("div");
    await act(async () => {
      await result.current.animateCommandOutput(el, "ok");
    });
    expect(result.current.isTyping).toBe(false);
  });
});
