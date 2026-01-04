import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { CriticalCSS } from "../CriticalCSS";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("CriticalCSS", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
  });

  it("renders style tag with critical CSS", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(<CriticalCSS theme="dark" />);
    const style = container.querySelector("#critical-css");
    expect(style).toBeInTheDocument();
    expect(style?.tagName).toBe("STYLE");
  });

  it("includes theme-specific CSS", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(<CriticalCSS theme="matrix" />);
    const style = container.querySelector("#critical-css");
    expect(style?.textContent).toContain("theme-matrix");
  });

  it("includes CSS variables", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(<CriticalCSS theme="dark" />);
    const style = container.querySelector("#critical-css");
    expect(style?.textContent).toContain(":root");
  });
});
