import { describe, it, beforeEach, expect } from "vitest";
import { demoCommand } from "../demoCommands";
import { ProjectMetadataService } from "@/lib/projects/projectMetadata";

describe("demoCommand", () => {
  beforeEach(() => {
    // reset project service singleton data
    const svc = ProjectMetadataService.getInstance();
    // ...existing code...
    // ensure a predictable return
    (svc as any).projects = [
      {
        id: "p1",
        name: "Proj1",
        description: "d",
        technologies: ["React"],
        demoUrl: "",
        featured: false,
      },
    ];
  });

  it("list returns info about projects", async () => {
    const out = await demoCommand.execute(["list"] as any);
    expect(out.type).toBe("success");
    expect(out.content as string).toContain("Available Projects");
  });

  it("open without id returns error", async () => {
    const out = await demoCommand.execute(["open"] as any);
    expect(out.type).toBe("error");
  });
});
