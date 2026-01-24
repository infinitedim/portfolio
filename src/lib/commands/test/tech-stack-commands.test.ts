import { describe, it, expect, beforeEach } from "vitest";
import { techStackCommand } from "../tech-stack-commands";
import { ProjectMetadataService } from "@/lib/projects/project-metadata";

describe("techStackCommand", () => {
  beforeEach(() => {
    const svc = ProjectMetadataService.getInstance();
    (svc as any).projects = [
      {
        id: "p1",
        name: "P1",
        description: "d",
        technologies: ["React", "Node.js"],
        featured: true,
      },
    ];
  });

  it("list returns success when technologies exist", async () => {
    const out = await techStackCommand.execute(["list"] as any);
    expect(out.type).toBe("success");
  });

  it("projects without tech returns error", async () => {
    const out = await techStackCommand.execute(["projects"] as any);
    expect(out.type).toBe("error");
  });
});
