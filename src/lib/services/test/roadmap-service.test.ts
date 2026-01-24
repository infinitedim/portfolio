import { describe, it, expect, beforeEach, vi } from "vitest";
import { RoadmapService } from "@/lib/services/roadmap-service";

// Mock fetch to return a valid roadmap response
const validApiResponse = {
  done: { total: 10 },
  learning: {
    total: 1,
    roadmaps: [
      {
        title: "Frontend Basics",
        id: "frontend",
        done: 1,
        skipped: 0,
        learning: 0,
        total: 1,
        updatedAt: new Date().toISOString(),
      },
    ],
    bestPractices: [
      {
        title: "Best Practices",
        id: "best",
        done: 0,
        total: 1,
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  streak: { count: 5 },
};

describe("RoadmapService", () => {
  beforeEach(async () => {
    // Dynamically import to avoid mock interference
    const module = await import("@/lib/services/roadmap-service");
    RoadmapService = module.RoadmapService;
    
    // ensure singleton reset by accessing internal instance if needed
    // stub fetch
    Object.defineProperty(globalThis, "fetch", {
      value: vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(validApiResponse),
        }),
      ) as any,
      writable: true,
      configurable: true,
    });
    // ensure window exists for client-side path (only if not already defined)
    if (typeof window === "undefined") {
      Object.defineProperty(globalThis, "window", {
        value: {} as any,
        writable: true,
        configurable: true,
      });
    }
    // Reset singleton instance to ensure clean state
    // Access private instance through any cast
    (RoadmapService as any).instance = undefined;
  });

  it("initializes and loads fallback/api data", async () => {
    const svc = RoadmapService.getInstance();
    await svc.initialize();

    const progress = await svc.getUserProgress();
    expect(progress).toHaveProperty("categories");
    expect(progress.categories.length).toBeGreaterThan(0);
  });

  it("can get category progress and update skills", async () => {
    const svc = RoadmapService.getInstance();
    await svc.initialize();

    const cat = await svc.getCategoryProgress("frontend");
    expect(cat).not.toBeNull();

    // update a skill
    const skill = cat!.skills[0];
    const updated = await svc.updateSkillProgress(skill.id, {
      status: "in-progress",
      progress: 50,
    } as any);
    expect(updated).toBe(true);

    const fetchedSkill = await svc.getSkill(skill.id);
    expect(fetchedSkill).not.toBeNull();
    expect(fetchedSkill!.status).toBe("in-progress");
  });
});
