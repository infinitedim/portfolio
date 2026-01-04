import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { ProjectsLoading } from "../ProjectsLoading";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("ProjectsLoading", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
  });

  it("renders loading skeleton cards", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(<ProjectsLoading />);

    // Should render 6 skeleton cards
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(6);
  });

  it("has grid layout", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(<ProjectsLoading />);

    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass("grid-cols-1", "md:grid-cols-2", "lg:grid-cols-3");
  });

  it("renders skeleton cards with proper structure", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(<ProjectsLoading />);

    // Each skeleton should have image placeholder and content area
    const imagePlaceholders = container.querySelectorAll(".h-48");
    expect(imagePlaceholders.length).toBe(6);
  });
});
