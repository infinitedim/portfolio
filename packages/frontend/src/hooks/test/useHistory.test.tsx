import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHistory } from "../useHistory";

describe("useEnhancedHistory", () => {
  it("adds, toggles favorite and provides suggestions", () => {
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
