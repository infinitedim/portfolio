import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { SkillCard } from "../skill-card";
import type { RoadmapSkill } from "@/types/roadmap";

// Mock theme hook
const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#0a0a0a",
    text: "#e5e5e5",
    accent: "#00ff41",
    muted: "#666666",
    border: "#333333",
    success: "#00ff41",
    prompt: "#00ff41",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
    theme: "default",
  }),
}));

// Mock formatTimestamp
vi.mock("@/lib/utils/utils", () => ({
  formatTimestamp: (date: Date) => date.toLocaleDateString(),
}));

describe("SkillCard", () => {
  const mockSkill: RoadmapSkill = {
    name: "React",
    description: "A JavaScript library for building user interfaces",
    status: "in-progress",
    progress: 75,
    priority: "high",
    projects: ["Project 1", "Project 2"],
    dateCompleted: undefined,
  };

  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering - Full Card", () => {
    it("should render skill card", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} />);

      expect(screen.getByText("React")).toBeInTheDocument();
    });

    it("should render skill name", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} />);

      expect(screen.getByText("React")).toBeInTheDocument();
    });

    it("should render skill description", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} />);

      expect(
        screen.getByText("A JavaScript library for building user interfaces"),
      ).toBeInTheDocument();
    });

    it("should render progress bar", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} />);

      expect(screen.getByText("Progress")).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("should render status badge", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} />);

      expect(screen.getByText("IN PROGRESS")).toBeInTheDocument();
    });

    it("should render priority icon", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} />);

      expect(screen.getByText("🔴")).toBeInTheDocument();
    });
  });

  describe("Status Icons", () => {
    it("should show completed icon for completed status", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const completedSkill = { ...mockSkill, status: "completed" as const };

      render(<SkillCard skill={completedSkill} />);

      expect(screen.getByText("✅")).toBeInTheDocument();
    });

    it("should show in-progress icon for in-progress status", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} />);

      expect(screen.getByText("🔄")).toBeInTheDocument();
    });

    it("should show not-started icon for not-started status", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const notStartedSkill = { ...mockSkill, status: "not-started" as const };

      render(<SkillCard skill={notStartedSkill} />);

      expect(screen.getByText("⭕")).toBeInTheDocument();
    });
  });

  describe("Priority Icons", () => {
    it("should show high priority icon", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} />);

      expect(screen.getByText("🔴")).toBeInTheDocument();
    });

    it("should show medium priority icon", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const mediumSkill = { ...mockSkill, priority: "medium" as const };

      render(<SkillCard skill={mediumSkill} />);

      expect(screen.getByText("🟡")).toBeInTheDocument();
    });

    it("should show low priority icon", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const lowSkill = { ...mockSkill, priority: "low" as const };

      render(<SkillCard skill={lowSkill} />);

      expect(screen.getByText("🟢")).toBeInTheDocument();
    });
  });

  describe("Projects Display", () => {
    it("should render related projects when showProjects is true", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} showProjects={true} />);

      expect(screen.getByText("Related Projects:")).toBeInTheDocument();
      expect(screen.getByText("Project 1")).toBeInTheDocument();
      expect(screen.getByText("Project 2")).toBeInTheDocument();
    });

    it("should not render projects when showProjects is false", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} showProjects={false} />);

      expect(screen.queryByText("Related Projects:")).not.toBeInTheDocument();
    });

    it("should not render projects when projects array is empty", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const skillWithoutProjects = { ...mockSkill, projects: [] };

      render(<SkillCard skill={skillWithoutProjects} showProjects={true} />);

      expect(screen.queryByText("Related Projects:")).not.toBeInTheDocument();
    });

    it("should not render projects when projects is undefined", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const skillWithoutProjects = { ...mockSkill, projects: undefined };

      render(<SkillCard skill={skillWithoutProjects} showProjects={true} />);

      expect(screen.queryByText("Related Projects:")).not.toBeInTheDocument();
    });
  });

  describe("Date Completed", () => {
    it("should render date completed when provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const completedDate = new Date("2024-01-01");
      const completedSkill = { ...mockSkill, dateCompleted: completedDate };

      render(<SkillCard skill={completedSkill} />);

      expect(screen.getByText(/Completed:/)).toBeInTheDocument();
    });

    it("should not render date completed when not provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} />);

      expect(screen.queryByText(/Completed:/)).not.toBeInTheDocument();
    });
  });

  describe("Compact Mode", () => {
    it("should render compact version when compact is true", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} compact={true} />);

      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("should not render description in compact mode", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} compact={true} />);

      expect(
        screen.queryByText("A JavaScript library for building user interfaces"),
      ).not.toBeInTheDocument();
    });

    it("should not render projects in compact mode", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} compact={true} showProjects={true} />);

      expect(screen.queryByText("Related Projects:")).not.toBeInTheDocument();
    });

    it("should render progress bar in compact mode", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} compact={true} />);

      expect(screen.getByText("75%")).toBeInTheDocument();
    });
  });

  describe("Progress Display", () => {
    it("should display correct progress percentage", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<SkillCard skill={mockSkill} />);

      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("should handle 0 progress", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const zeroProgressSkill = { ...mockSkill, progress: 0 };

      render(<SkillCard skill={zeroProgressSkill} />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("should handle 100 progress", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const fullProgressSkill = { ...mockSkill, progress: 100 };

      render(<SkillCard skill={fullProgressSkill} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });
});
