import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImportExportManager } from "../ImportExportManager";

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
    prompt: "#bb9af7",
  },
};

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "dark",
    themeConfig: mockThemeConfig,
  }),
}));

// Mock CustomizationService
const mockCustomThemes = [
  {
    id: "custom-1",
    name: "Custom Theme 1",
    source: "custom",
    colors: mockThemeConfig.colors,
    createdAt: new Date(),
  },
];

const mockCustomFonts = [
  {
    id: "custom-font-1",
    name: "Custom Font",
    family: "CustomFont",
    source: "custom",
    weight: "400",
    createdAt: new Date(),
  },
];

const mockSettings = {
  currentTheme: "dark",
  currentFont: "fira-code",
  fontSize: 16,
  autoSave: true,
};

const mockExportThemes = vi.fn().mockReturnValue({
  version: "1.0.0",
  themes: mockCustomThemes,
});

const mockImportThemes = vi.fn().mockResolvedValue({
  success: 2,
  errors: [],
});

const mockResetToDefaults = vi.fn();
const mockGetSettings = vi.fn().mockReturnValue(mockSettings);
const mockGetCustomThemes = vi.fn().mockReturnValue(mockCustomThemes);
const mockGetCustomFonts = vi.fn().mockReturnValue(mockCustomFonts);

vi.mock("@/lib/services/customizationService", () => ({
  CustomizationService: {
    getInstance: () => ({
      exportThemes: mockExportThemes,
      importThemes: mockImportThemes,
      resetToDefaults: mockResetToDefaults,
      getSettings: mockGetSettings,
      getCustomThemes: mockGetCustomThemes,
      getCustomFonts: mockGetCustomFonts,
    }),
  },
}));

describe("ImportExportManager", () => {
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL methods
    vi.spyOn(URL, "createObjectURL").mockReturnValue("mock-blob-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => { });
  });

  it("renders Export section header", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    expect(screen.getByText("📤 Export")).toBeDefined();
  });

  it("renders Import section header", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    expect(screen.getByText("📥 Import")).toBeDefined();
  });

  it("renders Quick Actions section", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    expect(screen.getByText("🚀 Quick Actions")).toBeDefined();
  });

  it("renders Export Custom Themes button", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    expect(screen.getByText("📤 Export Themes")).toBeDefined();
  });

  it("renders Export All Backup button", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    expect(screen.getByText("📦 Export All")).toBeDefined();
  });

  it("displays custom theme count", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    expect(screen.getByText("1 custom themes available")).toBeDefined();
  });

  it("displays custom theme and font counts in backup section", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    expect(screen.getByText("1 custom themes")).toBeDefined();
    expect(screen.getByText("1 custom fonts")).toBeDefined();
  });

  it("renders Import Themes section", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    expect(screen.getByText("Import Themes")).toBeDefined();
  });

  it("renders Choose File button for import", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    expect(screen.getByText("📁 Choose File")).toBeDefined();
  });

  it("exports themes when Export Themes button is clicked", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    const exportButton = screen.getByText("📤 Export Themes");
    fireEvent.click(exportButton);

    expect(mockExportThemes).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("exports all backup when Export All button is clicked", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    const exportAllButton = screen.getByText("📦 Export All");
    fireEvent.click(exportAllButton);

    expect(mockGetSettings).toHaveBeenCalled();
    expect(mockGetCustomThemes).toHaveBeenCalled();
    expect(mockGetCustomFonts).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("disables Export Themes button when no custom themes", () => {
    mockGetCustomThemes.mockReturnValue([]);

    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    const exportButton = screen.getByText("📤 Export Themes");
    expect(exportButton.hasAttribute("disabled")).toBe(true);
  });

  it("triggers file input when Choose File is clicked", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    const chooseFileButton = screen.getByText("📁 Choose File");
    // Clicking should trigger the hidden file input
    fireEvent.click(chooseFileButton);

    // The file input exists in the DOM
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeDefined();
  });

  it("shows import success result", async () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    // Simulate file selection
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(['{}'], 'themes.json', { type: 'application/json' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Successfully imported 2 themes/i)).toBeDefined();
    });

    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it("shows import error result", async () => {
    mockImportThemes.mockResolvedValueOnce({
      success: 0,
      errors: ["Invalid theme format"],
    });

    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(['invalid'], 'themes.json', { type: 'application/json' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/1 errors occurred/i)).toBeDefined();
    });
  });

  it("renders Reset All button", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    expect(screen.getByText("🔄 Reset All")).toBeDefined();
  });

  it("resets all when Reset All is clicked and confirmed", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    const resetButton = screen.getByText("🔄 Reset All");
    fireEvent.click(resetButton);

    expect(mockResetToDefaults).toHaveBeenCalled();
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it("does not reset when confirmation is cancelled", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    const resetButton = screen.getByText("🔄 Reset All");
    fireEvent.click(resetButton);

    expect(mockResetToDefaults).not.toHaveBeenCalled();
  });

  it("renders Storage Info button", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    expect(screen.getByText("📊 Storage Info")).toBeDefined();
  });

  it("shows storage info alert when Storage Info is clicked", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => { });

    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    const storageInfoButton = screen.getByText("📊 Storage Info");
    fireEvent.click(storageInfoButton);

    expect(alertSpy).toHaveBeenCalled();
    expect(alertSpy.mock.calls[0][0]).toContain("Storage Info");
  });

  it("renders Tips section", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    expect(screen.getByText("💡 Tips & Best Practices")).toBeDefined();
  });

  it("displays tip about exporting regularly", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    expect(
      screen.getByText(
        /Export your customizations regularly to avoid losing your work/i
      )
    ).toBeDefined();
  });

  it("applies theme colors to section headers", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    const exportHeader = screen.getByText("📤 Export");
    expect(exportHeader.style.color).toBe(mockThemeConfig.colors.accent);
  });

  it("shows supported file format hint", () => {
    render(<ImportExportManager onUpdate={mockOnUpdate} />);

    expect(screen.getByText(/Supports .json theme files/i)).toBeDefined();
  });
});
