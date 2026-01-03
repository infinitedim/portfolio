import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingsManager } from "../SettingsManager";

// Mock theme config
const mockThemeConfig = {
  colors: {
    bg: "#1a1b26",
    text: "#a9b1d6",
    accent: "#7aa2f7",
    border: "#3b4261",
    muted: "#565f89",
    success: "#9ece6a",
    error: "#f7768e",
  },
};

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "dark",
    themeConfig: mockThemeConfig,
  }),
}));

// Mock CustomizationService
const mockSettings = {
  currentTheme: "dark",
  currentFont: "fira-code",
  fontSize: 16,
  lineHeight: 1.6,
  letterSpacing: 0,
  autoSave: true,
};

const mockGetSettings = vi.fn().mockReturnValue(mockSettings);
const mockSaveSettings = vi.fn();
const mockResetToDefaults = vi.fn();

vi.mock("@/lib/services/customizationService", () => ({
  CustomizationService: {
    getInstance: () => ({
      getSettings: mockGetSettings,
      saveSettings: mockSaveSettings,
      resetToDefaults: mockResetToDefaults,
      getDefaultSettings: () => ({
        currentTheme: "dark",
        currentFont: "fira-code",
        fontSize: 14,
        lineHeight: 1.5,
        letterSpacing: 0,
        autoSave: false,
      }),
    }),
  },
}));

// Mock TerminalLoadingProgress
vi.mock("@/components/ui/TerminalLoadingProgress", () => ({
  TerminalLoadingProgress: () => <div data-testid="loading">Loading...</div>,
}));

describe("SettingsManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockReturnValue(mockSettings);
  });

  it("renders settings manager header", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      expect(screen.getByText("⚙️ Customization Settings")).toBeDefined();
    });
  });

  it("displays description text", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      expect(
        screen.getByText("Configure appearance and behavior preferences")
      ).toBeDefined();
    });
  });

  it("renders General section", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      expect(screen.getByText("General")).toBeDefined();
    });
  });

  it("renders Typography & Display section", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      expect(screen.getByText("Typography & Display")).toBeDefined();
    });
  });

  it("renders auto-save checkbox", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      expect(screen.getByLabelText("Auto-save Changes")).toBeDefined();
    });
  });

  it("displays current auto-save state", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      const checkbox = screen.getByLabelText(
        "Auto-save Changes"
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(true); // mockSettings.autoSave is true
    });
  });

  it("renders font size slider", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      expect(screen.getByText(/Font Size: 16px/i)).toBeDefined();
    });
  });

  it("updates font size when slider changes", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      const slider = screen.getByLabelText(
        /Font Size:/i
      ) as HTMLInputElement;
      fireEvent.change(slider, { target: { value: "18" } });

      expect(screen.getByText(/Font Size: 18px/i)).toBeDefined();
    });
  });

  it("auto-saves when auto-save is enabled and setting changes", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      const slider = screen.getByLabelText(
        /Font Size:/i
      ) as HTMLInputElement;
      fireEvent.change(slider, { target: { value: "18" } });
    });

    expect(mockSaveSettings).toHaveBeenCalled();
  });

  it("shows Save button when auto-save is off and changes exist", async () => {
    mockGetSettings.mockReturnValue({ ...mockSettings, autoSave: false });

    render(<SettingsManager />);

    await waitFor(() => {
      const slider = screen.getByLabelText(
        /Font Size:/i
      ) as HTMLInputElement;
      fireEvent.change(slider, { target: { value: "18" } });
    });

    expect(screen.getByText("💾 Save Changes")).toBeDefined();
  });

  it("hides Save button when auto-save is on", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      expect(screen.queryByText("💾 Save Changes")).toBeNull();
    });
  });

  it("renders Reset to Defaults button", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      expect(screen.getByText("🔄 Reset to Defaults")).toBeDefined();
    });
  });

  it("resets settings when Reset button is clicked and confirmed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<SettingsManager />);

    await waitFor(() => {
      const resetButton = screen.getByText("🔄 Reset to Defaults");
      fireEvent.click(resetButton);
    });

    expect(mockResetToDefaults).toHaveBeenCalled();
  });

  it("does not reset when confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<SettingsManager />);

    await waitFor(() => {
      const resetButton = screen.getByText("🔄 Reset to Defaults");
      fireEvent.click(resetButton);
    });

    expect(mockResetToDefaults).not.toHaveBeenCalled();
  });

  it("renders Live Preview section", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      expect(screen.getByText("Live Preview")).toBeDefined();
    });
  });

  it("displays preview text in Live Preview", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      expect(
        screen.getByText("The quick brown fox jumps over the lazy dog.")
      ).toBeDefined();
    });
  });

  it("applies font size to Live Preview", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      const previewText = screen.getByText(
        "The quick brown fox jumps over the lazy dog."
      );
      expect(previewText.style.fontSize).toContain("16");
    });
  });

  it("toggles auto-save when checkbox is clicked", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      const checkbox = screen.getByLabelText(
        "Auto-save Changes"
      ) as HTMLInputElement;
      fireEvent.click(checkbox);
    });

    // When auto-save is toggled off, it should still auto-save this change
    // because settings.autoSave was true before the change
    expect(mockSaveSettings).toHaveBeenCalledWith({ autoSave: false });
  });

  it("saves changes when Save button is clicked", async () => {
    mockGetSettings.mockReturnValue({ ...mockSettings, autoSave: false });

    render(<SettingsManager />);

    await waitFor(() => {
      const slider = screen.getByLabelText(
        /Font Size:/i
      ) as HTMLInputElement;
      fireEvent.change(slider, { target: { value: "18" } });
    });

    const saveButton = screen.getByText("💾 Save Changes");
    fireEvent.click(saveButton);

    expect(mockSaveSettings).toHaveBeenCalled();
  });

  it("applies theme colors to header", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      const header = screen.getByText("⚙️ Customization Settings");
      expect(header.style.color).toBe(mockThemeConfig.colors.accent);
    });
  });

  it("loads settings on mount", async () => {
    render(<SettingsManager />);

    await waitFor(() => {
      expect(mockGetSettings).toHaveBeenCalled();
    });
  });
});
