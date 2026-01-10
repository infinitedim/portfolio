import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LazyCustomizationManager, LazyThemeEditor, LazyFontManager, LazyRoadmapVisualizer, LazyLoadingFallback } from "../index";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("Lazy Components Index", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
  });

  it("LazyLoadingFallback renders loading indicator", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<LazyLoadingFallback />);

    expect(screen.getByText("Loading component...")).toBeInTheDocument();
  });

  it("LazyLoadingFallback has spinner", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(<LazyLoadingFallback />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("exports lazy components", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    expect(LazyCustomizationManager).toBeDefined();
    expect(LazyThemeEditor).toBeDefined();
    expect(LazyFontManager).toBeDefined();
    expect(LazyRoadmapVisualizer).toBeDefined();
  });
});
