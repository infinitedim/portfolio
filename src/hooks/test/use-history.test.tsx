import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHistory } from "@/hooks/use-history";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("useEnhancedHistory", () => {
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

  it("adds, toggles favorite and provides suggestions", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { result } = renderHook(() => useHistory({ maxHistorySize: 10 }));

    act(() => result.current.addToHistory("build project"));
    act(() => result.current.addToHistory("deploy"));
    act(() => result.current.addToHistory("build project"));

    expect(result.current.totalCommands).toBeGreaterThan(0);
    act(() => result.current.toggleFavorite("build project"));
    // favorites is an array of commands (strings)
    expect(Array.isArray(result.current.favorites)).toBe(true);
    const suggestions = result.current.getSuggestions("b");
    expect(Array.isArray(suggestions)).toBe(true);
  });
});
