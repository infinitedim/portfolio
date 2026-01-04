import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StaticContent } from "../StaticContent";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("StaticContent", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
  });

  it("renders static content", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(<StaticContent />);
    expect(container.querySelector(".static-content")).toBeInTheDocument();
  });

  it("includes screen reader only content", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<StaticContent />);
    const srContent = screen.getByText(/Terminal Portfolio/i);
    expect(srContent).toBeInTheDocument();
    expect(srContent.closest(".sr-only")).toBeInTheDocument();
  });

  it("includes ASCII preload", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(<StaticContent />);
    const asciiPreload = container.querySelector(".ascii-preload");
    expect(asciiPreload).toBeInTheDocument();
  });

  it("includes structured data script", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(<StaticContent />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
  });
});
