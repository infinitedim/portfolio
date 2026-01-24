import { describe, it, beforeEach, expect } from "vitest";
import { AliasManager, aliasCommand } from "../alias-commands";

describe("AliasManager and aliasCommand", () => {
  beforeEach(() => {
    // ensure clean localStorage
    localStorage.removeItem("terminal-aliases");
    // reset singleton by accessing instance and resetting
    AliasManager.getInstance().resetToDefaults();
  });

  it("resolves default alias and allows add/remove custom alias", () => {
    const manager = AliasManager.getInstance();
    expect(manager.hasAlias("h")).toBe(true);
    // add custom alias
    expect(manager.addAlias("ll", "skills")).toBe(true);
    expect(manager.hasAlias("ll")).toBe(true);
    expect(manager.getCustomAliases()).toHaveProperty("ll");
    // remove custom alias
    expect(manager.removeAlias("ll")).toBe(true);
    expect(manager.hasAlias("ll")).toBe(false);
  });

  it("aliasCommand returns help when -h provided", async () => {
    const out = await aliasCommand.execute(["-h"]);
    expect(out.type).toBe("success");
    expect(typeof out.content).toBe("string");
  });
});
