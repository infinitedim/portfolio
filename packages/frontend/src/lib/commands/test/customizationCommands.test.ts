import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/services/customizationService", () => {
  const mock = {
    getInstance: () => ({
      getCustomThemes: () => [],
      getAllThemes: () => [{ id: "t1", name: "Built", source: "built-in" }],
      getCustomFonts: () => [],
      getAllFonts: () => [
        {
          id: "f1",
          name: "JetBrains",
          source: "system",
          ligatures: true,
          size: 0,
        },
      ],
    }),
  };
  return { CustomizationService: mock };
});

import { themesCommand, fontsCommand } from "../customizationCommands";

describe("customizationCommands", () => {
  it("themes custom returns info when none", async () => {
    const out = await themesCommand.execute(["custom"] as any);
    expect(out.type).toBe("info");
  });

  it("themes default returns success", async () => {
    const out = await themesCommand.execute([] as any);
    expect(out.type).toBe("success");
  });

  it("fonts custom returns info when none", async () => {
    const out = await fontsCommand.execute(["custom"] as any);
    expect(out.type).toBe("info");
  });

  it("fonts list returns success", async () => {
    const out = await fontsCommand.execute([] as any);
    expect(out.type).toBe("success");
  });
});
