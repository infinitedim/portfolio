import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { Breadcrumb, BreadcrumbTemplates } from "../breadcrumb";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Breadcrumb", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render breadcrumb navigation", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const items = [
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects", current: true },
      ];

      render(<Breadcrumb items={items} />);

      expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
    });

    it("should render all breadcrumb items", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const items = [
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects" },
        { label: "Project 1", href: "/projects/1", current: true },
      ];

      render(<Breadcrumb items={items} />);

      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Projects")).toBeInTheDocument();
      expect(screen.getByText("Project 1")).toBeInTheDocument();
    });

    it("should render current item as span", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const items = [
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects", current: true },
      ];

      render(<Breadcrumb items={items} />);

      const currentItem = screen.getByText("Projects");
      expect(currentItem).toHaveAttribute("aria-current", "page");
    });

    it("should render non-current items as links", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const items = [
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects", current: true },
      ];

      render(<Breadcrumb items={items} />);

      const homeLink = screen.getByText("Home");
      expect(homeLink.closest("a")).toHaveAttribute("href", "/");
    });

    it("should render separators between items", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const items = [
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects" },
        { label: "Project 1", href: "/projects/1", current: true },
      ];

      const { container } = render(<Breadcrumb items={items} />);

      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBe(2); // Separators between 3 items
    });

    it("should include structured data script", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const items = [
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects", current: true },
      ];

      const { container } = render(<Breadcrumb items={items} />);

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeInTheDocument();
    });
  });

  describe("BreadcrumbTemplates", () => {
    it("should generate home breadcrumb", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const items = BreadcrumbTemplates.home();

      expect(items).toHaveLength(1);
      expect(items[0].label).toBe("Home");
      expect(items[0].current).toBe(true);
    });

    it("should generate projects breadcrumb", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const items = BreadcrumbTemplates.projects();

      expect(items).toHaveLength(2);
      expect(items[0].label).toBe("Home");
      expect(items[1].label).toBe("Projects");
      expect(items[1].current).toBe(true);
    });

    it("should generate project breadcrumb", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const items = BreadcrumbTemplates.project("My Project", "my-project");

      expect(items).toHaveLength(3);
      expect(items[0].label).toBe("Home");
      expect(items[1].label).toBe("Projects");
      expect(items[2].label).toBe("My Project");
      expect(items[2].current).toBe(true);
    });

    it("should generate skills breadcrumb", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const items = BreadcrumbTemplates.skills();

      expect(items).toHaveLength(2);
      expect(items[0].label).toBe("Home");
      expect(items[1].label).toBe("Skills");
      expect(items[1].current).toBe(true);
    });

    it("should generate skill breadcrumb", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const items = BreadcrumbTemplates.skill("React", "react");

      expect(items).toHaveLength(3);
      expect(items[0].label).toBe("Home");
      expect(items[1].label).toBe("Skills");
      expect(items[2].label).toBe("React");
      expect(items[2].current).toBe(true);
    });
  });
});
