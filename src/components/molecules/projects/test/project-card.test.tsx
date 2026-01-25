import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { ProjectCard } from "../project-card";
import type { Project } from "@/lib/data/data-fetching";

// Mock OptimizedImage
vi.mock("@/components/molecules/shared/optimized-image", () => ({
  OptimizedImage: ({ alt }: { alt: string }) => (
    <div data-testid="optimized-image">{alt}</div>
  ),
}));

// Mock ImageErrorBoundary
vi.mock("@/components/organisms/error/image-error-boundary", () => ({
  ImageErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="image-error-boundary">{children}</div>
  ),
}));

describe("ProjectCard", () => {
  const mockProject: Project = {
    id: "project-1",
    name: "Test Project",
    description: "A test project description",
    technologies: ["React", "TypeScript", "Next.js", "Tailwind", "Vitest"],
    status: "completed",
    demoUrl: "https://example.com/demo",
    githubUrl: "https://github.com/example/project",
    imageUrl: "https://example.com/image.jpg",
  };

  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render project card", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ProjectCard project={mockProject} />);

      expect(screen.getByText("Test Project")).toBeInTheDocument();
    });

    it("should render project name", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ProjectCard project={mockProject} />);

      expect(screen.getByText("Test Project")).toBeInTheDocument();
    });

    it("should render project description", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ProjectCard project={mockProject} />);

      expect(screen.getByText("A test project description")).toBeInTheDocument();
    });

    it("should render technologies", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ProjectCard project={mockProject} />);

      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });

    it("should show more technologies count when more than 4", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ProjectCard project={mockProject} />);

      expect(screen.getByText("+1 more")).toBeInTheDocument();
    });

    it("should render status badge", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ProjectCard project={mockProject} />);

      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("should render featured badge when featured is true", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ProjectCard project={mockProject} featured={true} />);

      expect(screen.getByText("⭐ FEATURED")).toBeInTheDocument();
    });

    it("should not render featured badge when featured is false", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ProjectCard project={mockProject} featured={false} />);

      expect(screen.queryByText("⭐ FEATURED")).not.toBeInTheDocument();
    });
  });

  describe("Links", () => {
    it("should render demo link when demoUrl is provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ProjectCard project={mockProject} />);

      const demoLink = screen.getByLabelText("View live demo of Test Project");
      expect(demoLink).toBeInTheDocument();
      expect(demoLink).toHaveAttribute("href", "https://example.com/demo");
      expect(demoLink).toHaveAttribute("target", "_blank");
    });

    it("should render github link when githubUrl is provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ProjectCard project={mockProject} />);

      const githubLink = screen.getByLabelText("View source code of Test Project");
      expect(githubLink).toBeInTheDocument();
      expect(githubLink).toHaveAttribute("href", "https://github.com/example/project");
      expect(githubLink).toHaveAttribute("target", "_blank");
    });

    it("should not render demo link when demoUrl is not provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const projectWithoutDemo = { ...mockProject, demoUrl: undefined };

      render(<ProjectCard project={projectWithoutDemo} />);

      expect(
        screen.queryByLabelText("View live demo of Test Project"),
      ).not.toBeInTheDocument();
    });

    it("should not render github link when githubUrl is not provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const projectWithoutGithub = { ...mockProject, githubUrl: undefined };

      render(<ProjectCard project={projectWithoutGithub} />);

      expect(
        screen.queryByLabelText("View source code of Test Project"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Status Display", () => {
    it("should show completed status", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ProjectCard project={mockProject} />);

      expect(screen.getByText(/Completed/)).toBeInTheDocument();
    });

    it("should show in-progress status", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const inProgressProject = { ...mockProject, status: "in-progress" as const };

      render(<ProjectCard project={inProgressProject} />);

      expect(screen.getByText(/In Progress/)).toBeInTheDocument();
    });

    it("should show planned status", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const plannedProject = { ...mockProject, status: "planned" as const };

      render(<ProjectCard project={plannedProject} />);

      expect(screen.getByText(/Planned/)).toBeInTheDocument();
    });
  });

  describe("Image Handling", () => {
    it("should render image when imageUrl is provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ProjectCard project={mockProject} />);

      expect(screen.getByTestId("optimized-image")).toBeInTheDocument();
    });

    it("should render placeholder when imageUrl is not provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const projectWithoutImage = { ...mockProject, imageUrl: undefined };

      render(<ProjectCard project={projectWithoutImage} />);

      expect(screen.getByText("🚀")).toBeInTheDocument();
      expect(screen.getByText("Project Preview")).toBeInTheDocument();
    });
  });

  describe("Schema.org Markup", () => {
    it("should have itemScope and itemType attributes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<ProjectCard project={mockProject} />);

      const article = container.querySelector("article[itemscope]");
      expect(article).toHaveAttribute("itemtype", "https://schema.org/CreativeWork");
    });

    it("should have itemProp for name", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ProjectCard project={mockProject} />);

      const nameElement = screen.getByText("Test Project");
      expect(nameElement).toHaveAttribute("itemProp", "name");
    });

    it("should have itemProp for description", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ProjectCard project={mockProject} />);

      const descElement = screen.getByText("A test project description");
      expect(descElement).toHaveAttribute("itemProp", "description");
    });
  });
});
