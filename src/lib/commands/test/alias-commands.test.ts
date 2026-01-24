import { describe, it, beforeEach, expect, vi } from "vitest";
import { AliasManager, aliasCommand } from "../alias-commands";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

describe("AliasManager and aliasCommand", () => {
  beforeEach(() => {
    // Setup localStorage mock
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
        writable: true,
        configurable: true,
      });
    } else {
      Object.defineProperty(global, "localStorage", {
        value: localStorageMock,
        writable: true,
        configurable: true,
      });
    }

    // Reset mocks
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();

    // Reset singleton by accessing instance and resetting
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
