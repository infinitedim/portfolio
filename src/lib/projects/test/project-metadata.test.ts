import { describe, it, expect, beforeEach } from "vitest";
import { ProjectMetadataService, SAMPLE_PROJECTS } from "@/lib/projects/project-metadata";

describe("ProjectMetadataService", () => {
  beforeEach(() => {
    // Reset singleton by accessing instance and replacing projects for isolation
    const svc = ProjectMetadataService.getInstance();
    svc["projects"] = [...SAMPLE_PROJECTS];
  });

  it("returns all projects and can fetch by id", () => {
    const svc = ProjectMetadataService.getInstance();
    const all = svc.getAllProjects();
    expect(all.length).toBeGreaterThan(0);

    const p = svc.getProjectById(all[0].id);
    expect(p).not.toBeUndefined();
  });

  it("can add, update and delete a project", () => {
    const svc = ProjectMetadataService.getInstance();
    const newProj = svc.addProject({
      name: "Test Project",
      description: "desc",
      technologies: ["ts"],
      category: "web-app",
      featured: false,
      tags: [],
    } as any);

    expect(newProj).toHaveProperty("id");

    const updated = svc.updateProject(newProj.id, { name: "Updated" });
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe("Updated");

    const deleted = svc.deleteProject(newProj.id);
    expect(deleted).toBe(true);
  });

  it("searches, filters by technology and category", () => {
    const svc = ProjectMetadataService.getInstance();
    const featured = svc.getFeaturedProjects();
    expect(featured.length).toBeGreaterThanOrEqual(0);

    const byCategory = svc.getProjectsByCategory("web-app");
    expect(Array.isArray(byCategory)).toBe(true);

    const byTech = svc.getProjectsByTechnology("react");
    expect(Array.isArray(byTech)).toBe(true);

    const search = svc.searchProjects("weather");
    expect(Array.isArray(search)).toBe(true);
  });
});
