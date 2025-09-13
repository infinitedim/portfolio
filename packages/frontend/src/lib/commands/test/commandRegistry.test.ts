import { describe, it, expect } from "vitest";
import {
  createHelpCommand,
  aboutCommand,
  projectsCommand,
} from "../commandRegistry";

describe("commandRegistry helpers", () => {
  it("help command returns success and mentions Featured Commands", async () => {
    const help = createHelpCommand(() => [aboutCommand, projectsCommand]);
    const out = await help.execute([]);
    expect(out.type).toBe("success");
    expect(out.content as string).toContain("Featured Commands");
  });

  it("about and projects return success text", async () => {
    const a = await aboutCommand.execute([]);
    expect(a.type).toBe("success");
    const p = await projectsCommand.execute([]);
    expect(p.type).toBe("success");
    expect(p.content as string).toContain("Featured Projects");
  });
});
