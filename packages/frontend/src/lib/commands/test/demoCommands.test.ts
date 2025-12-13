import { describe, it, beforeEach, expect, vi } from "vitest";
import { demoCommand, setDemoCallback } from "../demoCommands";
import { ProjectMetadataService } from "@/lib/projects/projectMetadata";

describe("demoCommand", () => {
  beforeEach(() => {
    // reset project service singleton data
    const svc = ProjectMetadataService.getInstance();
    // ensure a predictable return
    (svc as any).projects = [
      {
        id: "p1",
        name: "Proj1",
        description: "Project description",
        technologies: ["React", "TypeScript"],
        tags: ["web", "frontend"],
        demoUrl: "https://demo.example.com",
        featured: true,
        category: "web",
      },
      {
        id: "p2",
        name: "Proj2",
        description: "Second project",
        technologies: ["Node.js"],
        tags: ["backend", "api"],
        demoUrl: "",
        featured: false,
        category: "backend",
      },
    ];
  });

  describe("list action", () => {
    it("returns info about projects", async () => {
      const out = await demoCommand.execute(["list"] as any);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Available Projects");
    });

    it("shows project names in list", async () => {
      const out = await demoCommand.execute(["list"] as any);
      expect(out.content as string).toContain("Proj1");
    });

    it("shows technologies in list", async () => {
      const out = await demoCommand.execute(["list"] as any);
      expect(out.content as string).toContain("React");
    });

    it("returns info when no projects available", async () => {
      const svc = ProjectMetadataService.getInstance();
      (svc as any).projects = [];

      const out = await demoCommand.execute(["list"] as any);
      expect(out.type).toBe("info");
      expect(out.content as string).toContain("No projects found");
    });
  });

  describe("open action", () => {
    it("returns error without project id", async () => {
      const out = await demoCommand.execute(["open"] as any);
      expect(out.type).toBe("error");
      expect(out.content as string).toContain("provide a project ID");
    });

    it("opens project with valid id and demo url", async () => {
      const callback = vi.fn();
      setDemoCallback(callback);

      const out = await demoCommand.execute(["open", "p1"] as any);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Opening demo");
      expect(callback).toHaveBeenCalledWith("p1");
    });

    it("returns error for non-existent project", async () => {
      const out = await demoCommand.execute(["open", "nonexistent"] as any);
      expect(out.type).toBe("error");
      expect(out.content as string).toContain("not found");
    });

    it("returns error when project has no demo url", async () => {
      const out = await demoCommand.execute(["open", "p2"] as any);
      expect(out.type).toBe("error");
      expect(out.content as string).toContain("not available");
    });
  });

  describe("search action", () => {
    it("returns error without query", async () => {
      const out = await demoCommand.execute(["search"] as any);
      expect(out.type).toBe("error");
      expect(out.content as string).toContain("provide a search query");
    });

    it("returns search results for matching query", async () => {
      const out = await demoCommand.execute(["search", "React"] as any);
      expect(["success", "info"]).toContain(out.type);
    });

    it("returns info when no results found", async () => {
      const out = await demoCommand.execute([
        "search",
        "nonexistenttech",
      ] as any);
      expect(out.type).toBe("info");
      expect(out.content as string).toContain("No projects found");
    });
  });

  describe("tech action", () => {
    it("lists technologies used in projects", async () => {
      const out = await demoCommand.execute(["tech"] as any);
      expect(["success", "info"]).toContain(out.type);
    });
  });

  describe("category action", () => {
    it("lists project categories", async () => {
      const out = await demoCommand.execute(["category"] as any);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Categories");
    });
  });

  describe("help action", () => {
    it("shows help when help action used", async () => {
      const out = await demoCommand.execute(["help"] as any);
      expect(out.type).toBe("info");
      expect(out.content as string).toContain("Demo Command Help");
    });

    it("shows help when no action provided", async () => {
      const out = await demoCommand.execute([] as any);
      expect(out.type).toBe("info");
    });
  });

  describe("unknown action", () => {
    it("returns error for unknown action", async () => {
      const out = await demoCommand.execute(["unknown"] as any);
      expect(out.type).toBe("error");
      expect(out.content as string).toContain("Unknown demo action");
    });
  });
});
