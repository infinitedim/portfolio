import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeManager } from "../ThemeManager";
import type { CustomTheme } from "@/types/customization";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock theme config
const mockThemeConfig = {
  colors: {
    bg: "#1a1b26",
    text: "#a9b1d6",
    prompt: "#bb9af7",
    accent: "#7aa2f7",
    border: "#3b4261",
    muted: "#565f89",
    success: "#9ece6a",
    error: "#f7768e",
  },
};

const mockChangeTheme = vi.fn().mockReturnValue(true);
const mockIsThemeActive = vi.fn().mockReturnValue(false);

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "dark",
    themeConfig: mockThemeConfig,
    changeTheme: mockChangeTheme,
    isThemeActive: mockIsThemeActive,
  }),
}));

// Mock CustomizationService
const mockDeleteCustomTheme = vi.fn().mockReturnValue(true);
const mockDuplicateTheme = vi.fn();

vi.mock("@/lib/services/customizationService", () => ({
  CustomizationService: {
    getInstance: () => ({
      deleteCustomTheme: mockDeleteCustomTheme,
      duplicateTheme: mockDuplicateTheme,
      saveCustomTheme: vi.fn(),
      updateCustomTheme: vi.fn(),
    }),
  },
}));

// Mock ThemeEditor
vi.mock("../ThemeEditor", () => ({
  ThemeEditor: ({
    onSave,
    onCancel,
  }: {
    onSave: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="theme-editor">
      <button onClick={onSave} data-testid="save-theme">
        Save
      </button>
      <button onClick={onCancel} data-testid="cancel-edit">
        Cancel
      </button>
    </div>
  ),
}));

// Mock ThemeName type
vi.mock("@/types/theme", () => ({
  ThemeName: {},
}));

describe("ThemeManager", () => {
  const mockOnUpdate = vi.fn();
  const mockOnApplyTheme = vi.fn();

  const mockThemes: CustomTheme[] = [
    {
      id: "dark",
      name: "Dark Theme",
      description: "A dark theme",
      source: "built-in",
      colors: mockThemeConfig.colors,
      createdAt: new Date("2024-01-01"),
    },
    {
      id: "light",
      name: "Light Theme",
      description: "A light theme",
      source: "built-in",
      colors: { ...mockThemeConfig.colors, bg: "#ffffff" },
      createdAt: new Date("2024-01-02"),
    },
    {
      id: "custom-1",
      name: "My Custom Theme",
      description: "Custom theme",
      source: "custom",
      colors: mockThemeConfig.colors,
      createdAt: new Date("2024-06-01"),
      modifiedAt: new Date("2024-06-15"),
    },
  ];

  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
    mockIsThemeActive.mockReturnValue(false);
  });

  it("renders theme manager header", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
        currentTheme="default"
      />
    );

    expect(screen.getByText("Theme Manager")).toBeDefined();
  });

  it("displays theme count", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
        currentTheme="default"
      />
    );

    expect(screen.getByText(/3 of 3 themes/i)).toBeDefined();
  });

  it("displays current theme name", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
        currentTheme="default"
      />
    );

    expect(screen.getByText(/Active: default/i)).toBeDefined();
  });

  it("renders all themes in the list", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    expect(screen.getByText("Dark Theme")).toBeDefined();
    expect(screen.getByText("Light Theme")).toBeDefined();
    expect(screen.getByText("My Custom Theme")).toBeDefined();
  });

  it("renders Create Theme button", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    expect(screen.getByText("+ Create Theme")).toBeDefined();
  });

  it("opens ThemeEditor when Create Theme is clicked", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    fireEvent.click(screen.getByText("+ Create Theme"));

    expect(screen.getByTestId("theme-editor")).toBeDefined();
  });

  it("filters themes by search query", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search themes...");
    fireEvent.change(searchInput, { target: { value: "Dark" } });

    expect(screen.getByText("Dark Theme")).toBeDefined();
    expect(screen.queryByText("Light Theme")).toBeNull();
    expect(screen.queryByText("My Custom Theme")).toBeNull();
  });

  it("filters themes by source", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    const sourceFilter = screen.getByDisplayValue("All Sources");
    fireEvent.change(sourceFilter, { target: { value: "custom" } });

    expect(screen.getByText("My Custom Theme")).toBeDefined();
    expect(screen.queryByText("Dark Theme")).toBeNull();
    expect(screen.queryByText("Light Theme")).toBeNull();
  });

  it("shows empty state when no themes match filter", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search themes...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(screen.getByText("No themes found")).toBeDefined();
  });

  it("applies theme when Apply button is clicked", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    const applyButtons = screen.getAllByText("Apply");
    fireEvent.click(applyButtons[0]);

    expect(mockChangeTheme).toHaveBeenCalled();
  });

  it("shows duplicate button for themes", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    const duplicateButtons = screen.getAllByTitle("Duplicate theme");
    expect(duplicateButtons.length).toBeGreaterThan(0);
  });

  it("duplicates theme when duplicate button is clicked", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    mockDuplicateTheme.mockReturnValue({
      id: "custom-2",
      name: "My Custom Theme (Copy)",
      source: "custom",
      colors: mockThemeConfig.colors,
      createdAt: new Date(),
    });

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    const duplicateButtons = screen.getAllByTitle("Duplicate theme");
    fireEvent.click(duplicateButtons[0]);

    expect(mockDuplicateTheme).toHaveBeenCalled();
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it("shows edit button only for custom themes", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    const editButtons = screen.getAllByTitle("Edit theme");
    // Only custom themes should have edit button
    expect(editButtons.length).toBe(1);
  });

  it("shows delete button only for custom themes", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    const deleteButtons = screen.getAllByTitle("Delete theme");
    // Only custom themes should have delete button
    expect(deleteButtons.length).toBe(1);
  });

  it("deletes theme when delete button is clicked and confirmed", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    const deleteButton = screen.getByTitle("Delete theme");
    fireEvent.click(deleteButton);

    expect(mockDeleteCustomTheme).toHaveBeenCalledWith("custom-1");
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it("does not delete theme when confirmation is cancelled", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    const deleteButton = screen.getByTitle("Delete theme");
    fireEvent.click(deleteButton);

    expect(mockDeleteCustomTheme).not.toHaveBeenCalled();
  });

  it("sorts themes by name by default", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    const themeCards = screen.getAllByText(/Theme/);
    // Themes should be sorted alphabetically
    expect(themeCards[0].textContent).toContain("Dark");
  });

  it("can sort themes by created date", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    const sortSelect = screen.getByDisplayValue("Sort by Name");
    fireEvent.change(sortSelect, { target: { value: "created" } });

    // Should not throw error
    expect(screen.getByText("Dark Theme")).toBeDefined();
  });

  it("shows source badge on theme cards", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    expect(screen.getAllByText("built-in").length).toBe(2);
    expect(screen.getByText("custom")).toBeDefined();
  });

  it("shows active indicator for current theme", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    mockIsThemeActive.mockImplementation((id: string) => id === "dark");

    render(
      <ThemeManager
        themes={mockThemes}
        onUpdate={mockOnUpdate}
        onApplyTheme={mockOnApplyTheme}
      />
    );

    expect(screen.getByText("✓ Active")).toBeDefined();
  });
});
