import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useI18n } from "../useI18n";

describe("useI18n", () => {
  it("exposes i18n helpers", () => {
    const { result } = renderHook(() => useI18n());
    expect(typeof result.current.t).toBe("function");
    expect(Array.isArray(result.current.getSupportedLocales())).toBe(true);
  });
});
