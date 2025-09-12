import { describe, it, expect, beforeEach, vi } from "vitest";
import { CustomizationService } from "../customizationService";

// Simple localStorage mock
const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) =>
    Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null,
  setItem: (k: string, v: string) => {
    storage[k] = v;
  },
  removeItem: (k: string) => {
    delete storage[k];
  },
  clear: () => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  },
};

// Minimal document.head manipulation mock exists in jsdom environment used by vitest setup

describe("CustomizationService", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", localStorageMock);
    localStorageMock.clear();
  });

  it("returns built-in themes plus custom themes via getAllThemes", () => {
    const svc = CustomizationService.getInstance();
    // Ensure no custom themes stored
    localStorageMock.removeItem("terminal-custom-themes");

    const all = svc.getAllThemes();
    expect(Array.isArray(all)).toBe(true);
    // built-in themes should be present
    expect(all.length).toBeGreaterThan(0);
  });

  it("can save, update, delete, and duplicate a custom theme", () => {
    const svc = CustomizationService.getInstance();

    // Save a new custom theme
    const saved = svc.saveCustomTheme({
      name: "My Theme",
      description: "A test theme",
      source: "custom",
      colors: {
        bg: "#000000",
        text: "#ffffff",
        prompt: "#111",
        success: "#0f0",
        error: "#f00",
        accent: "#0ea5e9",
        border: "#222",
      },
    } as any);

    expect(saved).toHaveProperty("id");
    expect(saved.name).toBe("My Theme");

    // Update theme
    const updated = svc.updateCustomTheme(saved.id, { name: "My Theme v2" });
    expect(updated).toBe(true);

    // Duplicate theme
    const duplicate = svc.duplicateTheme(saved.id, "Copied Theme");
    expect(duplicate).not.toBeNull();
    expect(duplicate?.name).toBe("Copied Theme");

    // Delete original
    const deleted = svc.deleteCustomTheme(saved.id);
    expect(deleted).toBe(true);

    // Deleting again should return false
    expect(svc.deleteCustomTheme(saved.id)).toBe(false);
  });

  it("manages settings and resetToDefaults", () => {
    const svc = CustomizationService.getInstance();

    // Set some settings
    svc.saveSettings({ currentTheme: "matrix" } as any);

    const settings = svc.getSettings();
    expect(settings).toHaveProperty("currentTheme");

    svc.resetToDefaults();

    // After reset, settings should be default
    const after = svc.getSettings();
    expect(after.currentTheme).toBe("dark");
  });
});
