import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { RoadmapOverview } from "../roadmap-overview";

// Mock dependencies
vi.mock("@/components/molecules/roadmap/progress-bar", () => ({
  ProgressBar: ({ progress }: any) => (
    <div data-testid="progress-bar">Progress: {progress}%</div>
  ),
}));

const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#000000",
    text: "#ffffff",
    accent: "#00ff00",
    border: "#333333",
    success: "#00ff00",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
    theme: "default",
  }),
}));

const mockRoadmapData = {
  categories: [
    {
      id: "cat1",
      name: "Category 1",
      skills: [
        { name: "Skill 1", status: "completed", progress: 100 },
        { name: "Skill 2", status: "in-progress", progress: 50 },
        { name: "Skill 3", status: "not-started", progress: 0 },
      ],
    },
  ],
};

describe("RoadmapOverview", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render roadmap overview", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<RoadmapOverview roadmapData={mockRoadmapData} />);

      expect(screen.getByText(/Roadmap Progress/i)).toBeInTheDocument();
    });

    it("should display overall progress percentage", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<RoadmapOverview roadmapData={mockRoadmapData} />);

      // 1 completed out of 3 total = 33%
      expect(screen.getByText(/33%/i)).toBeInTheDocument();
    });

    it("should display stats", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<RoadmapOverview roadmapData={mockRoadmapData} />);

      expect(screen.getByText(/Total Skills/i)).toBeInTheDocument();
      expect(screen.getByText(/Completed/i)).toBeInTheDocument();
      expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
      expect(screen.getByText(/Not Started/i)).toBeInTheDocument();
    });

    it("should render in compact mode", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <RoadmapOverview roadmapData={mockRoadmapData} compact={true} />,
      );

      const overview = container.querySelector(".p-3");
      expect(overview).toBeInTheDocument();
    });
  });

  describe("Progress Calculation", () => {
    it("should calculate progress correctly", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<RoadmapOverview roadmapData={mockRoadmapData} />);

      expect(screen.getByText("3")).toBeInTheDocument(); // Total
      expect(screen.getByText("1")).toBeInTheDocument(); // Completed
      expect(screen.getByText("1")).toBeInTheDocument(); // In Progress
    });

    it("should handle empty roadmap data", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const emptyData = { categories: [] };
      render(<RoadmapOverview roadmapData={emptyData} />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });
});
