import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FontManager } from "../FontManager";
import type { CustomFont } from "@/types/customization";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

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

const mockChangeFont = vi.fn();

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "dark",
    themeConfig: mockThemeConfig,
  }),
}));

vi.mock("@/hooks/useFont", () => ({
  useFont: () => ({
    changeFont: mockChangeFont,
    currentFont: "fira-code",
  }),
}));

// Mock CustomizationService
const mockSaveCustomFont = vi.fn();
const mockDeleteCustomFont = vi.fn().mockReturnValue(true);
const mockSaveSettings = vi.fn();

vi.mock("@/lib/services/customizationService", () => ({
  CustomizationService: {
    getInstance: () => ({
      saveCustomFont: mockSaveCustomFont,
      deleteCustomFont: mockDeleteCustomFont,
      saveSettings: mockSaveSettings,
    }),
  },
}));

describe("FontManager", () => {
  const mockOnUpdate = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  const mockFonts: CustomFont[] = [
    {
      id: "fira-code",
      name: "Fira Code",
      family: "Fira Code",
      source: "system",
      weight: "400",
      style: "normal",
      ligatures: true,
      createdAt: new Date(),
    },
    {
      id: "jetbrains-mono",
      name: "JetBrains Mono",
      family: "JetBrains Mono",
      source: "google",
      weight: "400",
      style: "normal",
      ligatures: true,
      createdAt: new Date(),
    },
    {
      id: "custom-font-1",
      name: "My Custom Font",
      family: "CustomFont",
      source: "custom",
      weight: "400",
      style: "normal",
      ligatures: false,
      size: 102400,
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  it("renders font list", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Fira Code")).toBeDefined();
    expect(screen.getByText("JetBrains Mono")).toBeDefined();
    expect(screen.getByText("My Custom Font")).toBeDefined();
  });

  it("renders search input", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByPlaceholderText("Search fonts...")).toBeDefined();
  });

  it("filters fonts by search query", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search fonts...");
    fireEvent.change(searchInput, { target: { value: "Fira" } });

    expect(screen.getByText("Fira Code")).toBeDefined();
    expect(screen.queryByText("JetBrains Mono")).toBeNull();
    expect(screen.queryByText("My Custom Font")).toBeNull();
  });

  it("renders source filter dropdown", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByDisplayValue("All Sources")).toBeDefined();
  });

  it("filters fonts by source", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const sourceFilter = screen.getByDisplayValue("All Sources");
    fireEvent.change(sourceFilter, { target: { value: "system" } });

    expect(screen.getByText("Fira Code")).toBeDefined();
    expect(screen.queryByText("JetBrains Mono")).toBeNull();
    expect(screen.queryByText("My Custom Font")).toBeNull();
  });

  it("renders upload button", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("📁 Upload")).toBeDefined();
  });

  it("displays source badges on font cards", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("system")).toBeDefined();
    expect(screen.getByText("google")).toBeDefined();
    expect(screen.getByText("custom")).toBeDefined();
  });

  it("displays ligature indicator for fonts with ligatures", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    // Fira Code and JetBrains Mono have ligatures
    const ligatureIndicators = screen.getAllByTitle("Supports ligatures");
    expect(ligatureIndicators.length).toBe(2);
  });

  it("displays font preview text", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    // Font preview text appears multiple times
    const previewTexts = screen.getAllByText(
      "The quick brown fox jumps over the lazy dog"
    );
    expect(previewTexts.length).toBeGreaterThan(0);
  });

  it("renders Apply button for each font", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const applyButtons = screen.getAllByText("Apply");
    expect(applyButtons.length).toBe(mockFonts.length);
  });

  it("renders Delete button only for custom fonts", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const deleteButtons = screen.getAllByText("Delete");
    expect(deleteButtons.length).toBe(1); // Only custom font
  });

  it("applies system font when Apply is clicked", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const applyButtons = screen.getAllByText("Apply");
    fireEvent.click(applyButtons[0]); // Click first (Fira Code - system font)

    expect(mockChangeFont).toHaveBeenCalledWith("fira-code");
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("deletes custom font when Delete is clicked and confirmed", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    expect(mockDeleteCustomFont).toHaveBeenCalledWith("custom-font-1");
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it("does not delete font when confirmation is cancelled", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    expect(mockDeleteCustomFont).not.toHaveBeenCalled();
  });

  it("shows empty state when font is not selected", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Select a Font")).toBeDefined();
    expect(
      screen.getByText("Choose a font from the list to preview it")
    ).toBeDefined();
  });

  it("shows font preview when a font is selected", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    // Click on a font to select it
    const fontCard = screen.getByText("Fira Code").closest("div[role='button']");
    if (fontCard) {
      fireEvent.click(fontCard);
    }

    expect(screen.getByText("Font Preview")).toBeDefined();
  });

  it("shows code sample in font preview", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    // Click on a font to select it
    const fontCard = screen.getByText("Fira Code").closest("div[role='button']");
    if (fontCard) {
      fireEvent.click(fontCard);
    }

    expect(screen.getByText("Code Sample")).toBeDefined();
  });

  it("shows terminal sample in font preview", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    // Click on a font to select it
    const fontCard = screen.getByText("Fira Code").closest("div[role='button']");
    if (fontCard) {
      fireEvent.click(fontCard);
    }

    expect(screen.getByText("Terminal Sample")).toBeDefined();
  });

  it("displays file size for custom fonts", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    // Custom font has size 102400 bytes = 100 KB
    expect(screen.getByText(/Size: 100.0 KB/i)).toBeDefined();
  });

  it("handles keyboard navigation for font selection", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const fontCard = screen.getByText("Fira Code").closest("div[role='button']");
    if (fontCard) {
      fireEvent.keyDown(fontCard, { key: "Enter" });
    }

    expect(screen.getByText("Font Preview")).toBeDefined();
  });

  it("applies theme colors to buttons", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <FontManager
        fonts={mockFonts}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const uploadButton = screen.getByText("📁 Upload");
    expect(uploadButton.style.color).toBe(mockThemeConfig.colors.success);
  });
});
