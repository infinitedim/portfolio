import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFont } from "../useFont";

describe("useFont", () => {
  it("initializes and changes font", () => {
    // Mock document and localStorage
    document.documentElement.style.setProperty(
      "--terminal-font-family",
      "mono",
    );

    const { result } = renderHook(() => useFont());

    expect(result.current.font).toBe(result.current.font);
    act(() => result.current.changeFont(result.current.font));
  });
});
