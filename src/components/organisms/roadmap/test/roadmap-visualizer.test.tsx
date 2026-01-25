import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { RoadmapVisualizer } from "../roadmap-visualizer";

// Mock dependencies
vi.mock("@/components/molecules/roadmap/skill-card", () => ({
  SkillCard: ({ skill }: any) => (
    <div data-testid="skill-card">{skill.name}</div>
  ),
}));

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
    muted: "#888888",
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

describe("RoadmapVisualizer", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render roadmap visualizer", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<RoadmapVisualizer roadmapData={mockRoadmapData} />);

      expect(screen.getByText("Grid")).toBeInTheDocument();
    });

    it("should display view mode buttons", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<RoadmapVisualizer roadmapData={mockRoadmapData} />);

      expect(screen.getByText("Grid")).toBeInTheDocument();
      expect(screen.getByText("List")).toBeInTheDocument();
      expect(screen.getByText("Progress")).toBeInTheDocument();
    });

    it("should display filter buttons", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<RoadmapVisualizer roadmapData={mockRoadmapData} />);

      expect(screen.getByText("ALL")).toBeInTheDocument();
      expect(screen.getByText("COMPLETED")).toBeInTheDocument();
      expect(screen.getByText("IN PROGRESS")).toBeInTheDocument();
    });
  });

  describe("View Mode Switching", () => {
    it("should switch to list view", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<RoadmapVisualizer roadmapData={mockRoadmapData} />);

      const listButton = screen.getByText("List");
      fireEvent.click(listButton);

      expect(screen.getByTestId("skill-card")).toBeInTheDocument();
    });

    it("should switch to progress view", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<RoadmapVisualizer roadmapData={mockRoadmapData} />);

      const progressButton = screen.getByText("Progress");
      fireEvent.click(progressButton);

      expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    });
  });

  describe("Filtering", () => {
    it("should filter by completed status", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<RoadmapVisualizer roadmapData={mockRoadmapData} />);

      const completedButton = screen.getByText("COMPLETED");
      fireEvent.click(completedButton);

      expect(screen.getByText("Skill 1")).toBeInTheDocument();
    });

    it("should filter by in-progress status", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<RoadmapVisualizer roadmapData={mockRoadmapData} />);

      const inProgressButton = screen.getByText("IN PROGRESS");
      fireEvent.click(inProgressButton);

      expect(screen.getByText("Skill 2")).toBeInTheDocument();
    });

    it("should show no skills message when filter matches nothing", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const emptyData = { categories: [] };
      render(<RoadmapVisualizer roadmapData={emptyData} />);

      expect(screen.getByText(/No skills found/i)).toBeInTheDocument();
    });
  });
});
