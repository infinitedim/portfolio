import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeEditor } from "../ThemeEditor";
import type { CustomTheme } from "@/types/customization";

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

describe("ThemeEditor", () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  const mockTheme: CustomTheme = {
    id: "custom-1",
    name: "My Custom Theme",
    description: "A custom theme for testing",
    author: "Test User",
    source: "custom",
    colors: {
      bg: "#1a1a1a",
      text: "#ffffff",
      prompt: "#00ff00",
      success: "#00ff00",
      error: "#ff0000",
      accent: "#0080ff",
      border: "#333333",
    },
    createdAt: new Date(),
  };

  const newTheme: CustomTheme = {
    id: "",
    name: "New Theme",
    description: "A custom theme",
    author: "User",
    source: "custom",
    colors: {
      bg: "#1a1a1a",
      text: "#ffffff",
      prompt: "#00ff00",
      success: "#00ff00",
      error: "#ff0000",
      accent: "#0080ff",
      border: "#333333",
    },
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders theme editor header for edit mode", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Edit Theme")).toBeDefined();
  });

  it("renders theme editor header for create mode", () => {
    render(
      <ThemeEditor
        theme={newTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Create New Theme")).toBeDefined();
  });

  it("displays theme name input with current value", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByPlaceholderText("Enter theme name");
    expect(nameInput).toBeDefined();
    expect((nameInput as HTMLInputElement).value).toBe("My Custom Theme");
  });

  it("displays description input with current value", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const descInput = screen.getByPlaceholderText("Describe your theme");
    expect(descInput).toBeDefined();
    expect((descInput as HTMLInputElement).value).toBe(
      "A custom theme for testing"
    );
  });

  it("updates theme name when input changes", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByPlaceholderText("Enter theme name");
    fireEvent.change(nameInput, { target: { value: "New Name" } });

    expect((nameInput as HTMLInputElement).value).toBe("New Name");
  });

  it("renders color palette section", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Color Palette")).toBeDefined();
  });

  it("renders all color fields", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Background")).toBeDefined();
    expect(screen.getByText("Text")).toBeDefined();
    expect(screen.getByText("Prompt")).toBeDefined();
    expect(screen.getByText("Success")).toBeDefined();
    expect(screen.getByText("Error")).toBeDefined();
    expect(screen.getByText("Accent")).toBeDefined();
    expect(screen.getByText("Border")).toBeDefined();
  });

  it("displays color descriptions", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Main background color")).toBeDefined();
    expect(screen.getByText("Primary text color")).toBeDefined();
  });

  it("renders preview button", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("👁️ Preview")).toBeDefined();
  });

  it("toggles preview mode when preview button is clicked", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const previewButton = screen.getByText("👁️ Preview");
    fireEvent.click(previewButton);

    expect(screen.getByText("👁️ Previewing")).toBeDefined();
  });

  it("shows Generate Random Theme button for new themes", () => {
    render(
      <ThemeEditor
        theme={newTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Generate Random Theme")).toBeDefined();
  });

  it("does not show Generate Random Theme button for existing themes", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText("Generate Random Theme")).toBeNull();
  });

  it("generates random theme when button is clicked", () => {
    render(
      <ThemeEditor
        theme={newTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const generateButton = screen.getByText("Generate Random Theme");
    fireEvent.click(generateButton);

    // Theme name should change to something random
    const nameInput = screen.getByPlaceholderText("Enter theme name");
    expect((nameInput as HTMLInputElement).value).not.toBe("New Theme");
  });

  it("shows color rule selector for new themes", () => {
    render(
      <ThemeEditor
        theme={newTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Color Rule")).toBeDefined();
  });

  it("renders Save button", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Save Theme")).toBeDefined();
  });

  it("renders Cancel button", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("calls onSave when Save button is clicked", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByText("Save Theme");
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
  });

  it("calls onCancel when Cancel button is clicked", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("disables Save button when name is empty", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByPlaceholderText("Enter theme name");
    fireEvent.change(nameInput, { target: { value: "" } });

    const saveButton = screen.getByText("Save Theme");
    expect(saveButton.hasAttribute("disabled")).toBe(true);
  });

  it("updates color when color input changes", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Find the text input for the background color
    const colorInputs = screen.getAllByPlaceholderText("#000000");
    fireEvent.change(colorInputs[0], { target: { value: "#ff0000" } });

    expect((colorInputs[0] as HTMLInputElement).value).toBe("#ff0000");
  });

  it("applies theme colors to UI elements", () => {
    render(
      <ThemeEditor
        theme={mockTheme}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const header = screen.getByText("Edit Theme");
    expect(header.style.color).toBe(mockThemeConfig.colors.accent);
  });
});
