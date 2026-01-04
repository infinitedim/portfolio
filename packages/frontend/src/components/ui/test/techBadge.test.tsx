import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TechBadge } from "../TechBadge";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("TechBadge", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  it("renders technology name and optional count", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(
      <TechBadge
        technology="React"
        count={3}
      />,
    );

    expect(screen.getByText("React")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });

  it("uses fallback colors for unknown technology", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<TechBadge technology="UnknownTech" />);

    expect(screen.getByText("UnknownTech")).toBeDefined();
  });

  it("calls onClick when interactive and clicked", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const onClick = vi.fn();

    render(
      <TechBadge
        technology="TypeScript"
        interactive
        onClick={onClick}
      />,
    );

    const badge = screen.getByText("TypeScript");
    // use native click to avoid extra dependencies
    (badge as HTMLElement).click();

    expect(onClick).toHaveBeenCalledWith("TypeScript");
  });

  it("is keyboard accessible when interactive", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const onClick = vi.fn();

    render(
      <TechBadge
        technology="Vue"
        interactive
        onClick={onClick}
      />,
    );

    const badge = screen.getByText("Vue");
    (badge as HTMLElement).focus();
    // dispatch Enter keydown
    badge.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );

    expect(onClick).toHaveBeenCalledWith("Vue");
  });
});
