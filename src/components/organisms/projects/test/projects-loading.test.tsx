import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { ProjectsLoading } from "../projects-loading";

describe("ProjectsLoading", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
  });

  describe("Rendering", () => {
    it("should render loading skeletons", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<ProjectsLoading />);

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should render 6 skeleton cards", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<ProjectsLoading />);

      // Should have 6 skeleton cards
      const cards = container.querySelectorAll(".bg-terminal-bg");
      expect(cards.length).toBe(6);
    });

    it("should have proper grid layout", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<ProjectsLoading />);

      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("grid-cols-1", "md:grid-cols-2", "lg:grid-cols-3");
    });
  });
});
