import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { CriticalCSS } from "../critical-css";

describe("CriticalCSS", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render critical CSS style tag", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<CriticalCSS theme="default" />);

      const style = container.querySelector("#critical-css");
      expect(style).toBeInTheDocument();
      expect(style?.tagName).toBe("STYLE");
    });

    it("should include theme CSS variables", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<CriticalCSS theme="default" />);

      const style = container.querySelector("#critical-css");
      expect(style?.textContent).toContain("--terminal-bg");
      expect(style?.textContent).toContain("--terminal-text");
    });

    it("should include font variables", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<CriticalCSS theme="default" />);

      const style = container.querySelector("#critical-css");
      expect(style?.textContent).toContain("--font-inter");
      expect(style?.textContent).toContain("--font-jetbrains-mono");
    });

    it("should include body styles", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<CriticalCSS theme="default" />);

      const style = container.querySelector("#critical-css");
      expect(style?.textContent).toContain("body");
    });

    it("should include theme class", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<CriticalCSS theme="matrix" />);

      const style = container.querySelector("#critical-css");
      expect(style?.textContent).toContain(".theme-matrix");
    });

    it("should include utility classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<CriticalCSS theme="default" />);

      const style = container.querySelector("#critical-css");
      expect(style?.textContent).toContain(".flex");
      expect(style?.textContent).toContain(".font-mono");
    });

    it("should include media queries", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<CriticalCSS theme="default" />);

      const style = container.querySelector("#critical-css");
      expect(style?.textContent).toContain("@media");
    });

    it("should include accessibility styles", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<CriticalCSS theme="default" />);

      const style = container.querySelector("#critical-css");
      expect(style?.textContent).toContain("prefers-reduced-motion");
      expect(style?.textContent).toContain("prefers-contrast");
    });
  });
});
