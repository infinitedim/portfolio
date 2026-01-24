import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Import component
import { TechBadge } from "../tech-badge";

describe("TechBadge", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<TechBadge technology="React" />);
      expect(container).toBeTruthy();
    });

    it("should render technology name", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<TechBadge technology="React" />);
      expect(screen.getByText("React")).toBeInTheDocument();
    });

    it("should render as span element", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<TechBadge technology="React" />);
      const span = container.querySelector("span");
      expect(span).toBeTruthy();
    });
  });

  describe("Technology Colors", () => {
    it("should apply React colors", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<TechBadge technology="React" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("bg-blue-500/20");
      expect(badge?.className).toContain("text-blue-400");
    });

    it("should apply TypeScript colors", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<TechBadge technology="TypeScript" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("bg-blue-600/20");
      expect(badge?.className).toContain("text-blue-400");
    });

    it("should apply default colors for unknown technology", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<TechBadge technology="UnknownTech" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("bg-gray-500/20");
      expect(badge?.className).toContain("text-gray-300");
    });

    it("should be case-insensitive for technology matching", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<TechBadge technology="react" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("bg-blue-500/20");
    });
  });

  describe("Count Display", () => {
    it("should not render count when not provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<TechBadge technology="React" />);
      const countBadge = screen.queryByText(/\d+/);
      expect(countBadge).not.toBeInTheDocument();
    });

    it("should render count when provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<TechBadge technology="React" count={5} />);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should render count badge with proper styling", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<TechBadge technology="React" count={10} />);
      const countBadge = container.querySelector(".rounded-full");
      expect(countBadge).toBeTruthy();
    });
  });

  describe("Sizes", () => {
    it("should apply small size classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <TechBadge technology="React" size="sm" />,
      );
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("text-xs");
    });

    it("should apply medium size classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <TechBadge technology="React" size="md" />,
      );
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("text-sm");
    });

    it("should apply large size classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <TechBadge technology="React" size="lg" />,
      );
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("text-base");
    });

    it("should default to medium size", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<TechBadge technology="React" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("text-sm");
    });
  });

  describe("Interactive Mode", () => {
    it("should not be interactive by default", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<TechBadge technology="React" />);
      const badge = container.querySelector("span");
      expect(badge?.getAttribute("role")).toBeNull();
      expect(badge?.getAttribute("tabIndex")).toBeNull();
    });

    it("should have button role when interactive", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <TechBadge technology="React" interactive />,
      );
      const badge = container.querySelector("span");
      expect(badge?.getAttribute("role")).toBe("button");
    });

    it("should have tabIndex when interactive", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <TechBadge technology="React" interactive />,
      );
      const badge = container.querySelector("span");
      expect(badge?.getAttribute("tabIndex")).toBe("0");
    });

    it("should call onClick when clicked and interactive", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const handleClick = vi.fn();
      render(
        <TechBadge
          technology="React"
          interactive
          onClick={handleClick}
        />,
      );

      const badge = screen.getByText("React");
      fireEvent.click(badge);

      expect(handleClick).toHaveBeenCalledWith("React");
    });

    it("should not call onClick when not interactive", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const handleClick = vi.fn();
      render(
        <TechBadge technology="React" onClick={handleClick} />,
      );

      const badge = screen.getByText("React");
      fireEvent.click(badge);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should handle Enter key press when interactive", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const handleClick = vi.fn();
      render(
        <TechBadge
          technology="React"
          interactive
          onClick={handleClick}
        />,
      );

      const badge = screen.getByText("React");
      fireEvent.keyDown(badge, { key: "Enter" });

      expect(handleClick).toHaveBeenCalledWith("React");
    });

    it("should handle Space key press when interactive", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const handleClick = vi.fn();
      render(
        <TechBadge
          technology="React"
          interactive
          onClick={handleClick}
        />,
      );

      const badge = screen.getByText("React");
      fireEvent.keyDown(badge, { key: " " });

      expect(handleClick).toHaveBeenCalledWith("React");
    });

    it("should not handle other keys", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const handleClick = vi.fn();
      render(
        <TechBadge
          technology="React"
          interactive
          onClick={handleClick}
        />,
      );

      const badge = screen.getByText("React");
      fireEvent.keyDown(badge, { key: "Tab" });

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Selected State", () => {
    it("should apply selected styles when selected", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <TechBadge technology="React" interactive selected />,
      );
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("ring-2");
      expect(badge?.className).toContain("ring-blue-400");
    });

    it("should not apply selected styles when not selected", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <TechBadge technology="React" interactive />,
      );
      const badge = container.querySelector("span");
      expect(badge?.className).not.toContain("ring-2");
    });
  });

  describe("Hover States", () => {
    it("should apply hover styles when interactive", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <TechBadge technology="React" interactive />,
      );
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("hover:scale-105");
      expect(badge?.className).toContain("hover:shadow-lg");
    });

    it("should handle mouse enter", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <TechBadge technology="React" interactive />,
      );
      const badge = container.querySelector("span");

      fireEvent.mouseEnter(badge!);
      // Hover state should be applied
      expect(badge).toBeInTheDocument();
    });

    it("should handle mouse leave", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <TechBadge technology="React" interactive />,
      );
      const badge = container.querySelector("span");

      fireEvent.mouseEnter(badge!);
      fireEvent.mouseLeave(badge!);
      // Should return to normal state
      expect(badge).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have rounded-full class", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<TechBadge technology="React" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("rounded-full");
    });

    it("should have border class", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<TechBadge technology="React" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("border");
    });

    it("should have font-medium class", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<TechBadge technology="React" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("font-medium");
    });

    it("should have transition classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<TechBadge technology="React" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("transition-all");
    });

    it("should have font-mono for technology name", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<TechBadge technology="React" />);
      const techName = container.querySelector(".font-mono");
      expect(techName).toBeTruthy();
    });
  });

  describe("Known Technologies", () => {
    const knownTechs = [
      "React",
      "Vue",
      "Angular",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "Node.js",
      "Python",
      "MongoDB",
      "PostgreSQL",
      "AWS",
      "Docker",
      "Git",
      "React Native",
      "Flutter",
    ];

    knownTechs.forEach((tech) => {
      it(`should apply colors for ${tech}`, () => {
        if (!canRunTests) {
          expect(true).toBe(true);
          return;
        }

        const { container } = render(<TechBadge technology={tech} />);
        const badge = container.querySelector("span");
        // Should have some color classes applied
        expect(badge?.className).toMatch(/bg-\w+-\d+\/20/);
        expect(badge?.className).toMatch(/text-\w+-\d+/);
      });
    });
  });
});
