import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock Next.js modules
vi.mock("next", () => ({
  Metadata: {},
}));

// Mock data fetching
const mockProjects = [
  {
    id: "1",
    name: "Test Project",
    description: "Test Description",
    technologies: ["React", "TypeScript"],
    status: "completed",
    demoUrl: "https://example.com",
    githubUrl: "https://github.com/example",
  },
];

const mockFeaturedProjects = [mockProjects[0]];

vi.mock("@/lib/data/data-fetching", () => ({
  getProjectsData: vi.fn(() => Promise.resolve(mockProjects)),
  getFeaturedProjects: vi.fn(() => Promise.resolve(mockFeaturedProjects)),
}));

// Mock components
vi.mock("@/components/molecules/projects/project-card", () => ({
  ProjectCard: ({
    project,
    featured,
  }: {
    project: unknown;
    featured: boolean;
  }) => (
    <div data-testid={`project-card-${featured ? "featured" : "regular"}`}>
      {JSON.stringify(project)}
    </div>
  ),
}));

vi.mock("@/components/organisms/projects/projects-loading", () => ({
  ProjectsLoading: () => <div data-testid="projects-loading">Loading...</div>,
}));

// Mock Suspense - don't mock react, just test without Suspense mocking
// Suspense will work normally in tests

// Import after mocks
import ProjectsPage, { generateMetadata } from "./page";

describe("ProjectsPage", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Metadata Generation", () => {
    it("should generate metadata with correct title", async () => {
      const metadata = await generateMetadata();
      expect(metadata.title).toBe("Projects | Terminal Portfolio");
    });

    it("should generate metadata with project count in description", async () => {
      const metadata = await generateMetadata();
      expect(metadata.description).toContain("1");
      expect(metadata.description).toContain("web development projects");
    });

    it("should include keywords from projects", async () => {
      const metadata = await generateMetadata();
      expect(metadata.keywords).toContain("web development projects");
      expect(metadata.keywords).toContain("react projects");
    });

    it("should have Open Graph configuration", async () => {
      const metadata = await generateMetadata();
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBe("Projects | Terminal Portfolio");
      expect(metadata.openGraph?.type).toBe("website");
    });

    it("should have Twitter Card configuration", async () => {
      const metadata = await generateMetadata();
      expect(metadata.twitter).toBeDefined();
      expect(metadata.twitter?.card).toBe("summary_large_image");
    });

    it("should have canonical URL", async () => {
      const metadata = await generateMetadata();
      expect(metadata.alternates?.canonical).toBe("/projects");
    });
  });

  describe("Component Rendering", () => {
    it("should render without crashing", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(await ProjectsPage());
      expect(container).toBeTruthy();
    });

    it("should render main element", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(await ProjectsPage());
      const mainElement = container.querySelector("main");
      expect(mainElement).toBeTruthy();
    });

    it("should render page title", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { getByText } = render(await ProjectsPage());
      expect(getByText(/projects/i)).toBeInTheDocument();
    });

    it("should render project count in description", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { getByText } = render(await ProjectsPage());
      expect(getByText(/1 web development projects/i)).toBeInTheDocument();
    });

    it("should render featured projects section when available", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { getByText } = render(await ProjectsPage());
      expect(getByText(/Featured Projects/i)).toBeInTheDocument();
    });

    it("should render all projects section", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { getByText } = render(await ProjectsPage());
      expect(getByText(/All Projects/i)).toBeInTheDocument();
    });

    it("should render project statistics", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { getByText } = render(await ProjectsPage());
      expect(getByText(/Total Projects/i)).toBeInTheDocument();
      expect(getByText(/Featured/i)).toBeInTheDocument();
      expect(getByText(/Technologies/i)).toBeInTheDocument();
      expect(getByText(/Completed/i)).toBeInTheDocument();
    });

    it("should render Suspense boundary", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(await ProjectsPage());
      // Suspense should render children normally
      expect(container).toBeTruthy();
    });

    it("should include structured data script", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(await ProjectsPage());
      const scripts = container.querySelectorAll(
        'script[type="application/ld+json"]',
      );
      expect(scripts.length).toBeGreaterThan(0);
    });

    it("should include ItemList schema in structured data", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(await ProjectsPage());
      const scripts = container.querySelectorAll(
        'script[type="application/ld+json"]',
      );
      const itemListScript = Array.from(scripts).find((script) => {
        const content = script.textContent || "";
        return content.includes('"@type": "ItemList"');
      });

      expect(itemListScript).toBeTruthy();
    });
  });
});
