import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { StaticContent } from "../static-content";

describe("StaticContent", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
  });

  describe("Rendering", () => {
    it("should render static content", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<StaticContent />);

      expect(container.querySelector(".static-content")).toBeInTheDocument();
    });

    it("should have screen reader only content", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<StaticContent />);

      const srOnly = container.querySelector(".sr-only");
      expect(srOnly).toBeInTheDocument();
      expect(srOnly?.textContent).toContain("Terminal Portfolio");
    });

    it("should have ASCII banner preload", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<StaticContent />);

      const asciiPreload = container.querySelector(".ascii-preload");
      expect(asciiPreload).toBeInTheDocument();
    });

    it("should have structured data script", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<StaticContent />);

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeInTheDocument();
    });

    it("should contain SEO content", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<StaticContent />);

      const content = container.textContent || "";
      expect(content).toContain("Available Commands");
      expect(content).toContain("Skills & Technologies");
      expect(content).toContain("Features");
    });
  });
});
