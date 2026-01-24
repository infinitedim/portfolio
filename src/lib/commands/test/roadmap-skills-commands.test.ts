import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock window for client-side checks
beforeEach(() => {
  if (typeof window === "undefined") {
    Object.defineProperty(global, "window", {
      value: {},
      writable: true,
      configurable: true,
    });
  }
});

vi.mock("@/lib/services/roadmap-service", () => ({
  RoadmapService: {
    getInstance: () => ({
      initialize: async () => {},
      getUserProgress: async () => ({
        username: "u",
        totalProgress: 50,
        completedSkills: 1,
        totalSkills: 2,
        lastUpdated: new Date(),
        categories: [
          {
            id: "c1",
            name: "Cat",
            skills: [
              {
                id: "s1",
                name: "Skill1",
                category: "c1",
                description: "",
                status: "in-progress",
                progress: 50,
                priority: "medium",
              },
            ],
            progress: 50,
          },
        ],
      }),
      getCategoryProgress: async () => ({
        id: "c1",
        name: "Cat",
        skills: [
          {
            id: "s1",
            name: "Skill1",
            category: "c1",
            description: "",
            status: "in-progress",
            progress: 50,
            priority: "medium",
          },
        ],
        progress: 50,
      }),
      updateSkillProgress: async () => true,
      getSkillsByStatus: async (s: string) =>
        s === "completed"
          ? []
          : [
              {
                id: "s1",
                name: "Skill1",
                category: "c1",
                description: "",
                status: "in-progress",
                progress: 50,
                priority: "medium",
              },
            ],
      refreshData: async () => {},
    }),
  },
}));

import { roadmapCommand, progressCommand } from "../roadmap-commands";
import { skillsCommand } from "../skills-commands";

describe("roadmap and skills commands", () => {
  it("roadmap overview returns success", async () => {
    const out = await roadmapCommand.execute([] as any);
    expect(out.type).toBe("success");
  });

  it("skills overview returns success", async () => {
    const out = await skillsCommand.execute([] as any);
    expect(out.type).toBe("success");
  });

  it("roadmap update with invalid args returns error", async () => {
    const out = await roadmapCommand.execute(["update"] as any);
    expect(out.type).toBe("error");
  });

  it("progress command returns summary success", async () => {
    const out = await progressCommand.execute([] as any);
    expect(out.type).toBe("success");
  });
});
