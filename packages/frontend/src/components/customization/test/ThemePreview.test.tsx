import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemePreview } from "../ThemePreview";
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

describe("ThemePreview", () => {
  const mockOnEdit = vi.fn();
  const mockOnApply = vi.fn();

  const mockTheme: CustomTheme = {
    id: "custom-1",
    name: "My Custom Theme",
    description: "A beautiful custom theme",
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
    createdAt: new Date("2024-06-01"),
    modifiedAt: new Date("2024-06-15"),
  };

  const builtInTheme: CustomTheme = {
    id: "dark",
    name: "Dark Theme",
    description: "Default dark theme",
    source: "built-in",
    colors: mockThemeConfig.colors,
    createdAt: new Date("2024-01-01"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders theme name", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText("My Custom Theme")).toBeDefined();
  });

  it("renders theme description", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText("A beautiful custom theme")).toBeDefined();
  });

  it("displays theme source", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText(/Source: custom/i)).toBeDefined();
  });

  it("displays created date", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText(/Created:/i)).toBeDefined();
  });

  it("displays modified date when available", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText(/Modified:/i)).toBeDefined();
  });

  it("renders Color Palette section", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText("Color Palette")).toBeDefined();
  });

  it("displays all color labels", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
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

  it("displays color hex values", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText("#1a1a1a")).toBeDefined();
    expect(screen.getByText("#ffffff")).toBeDefined();
  });

  it("renders Terminal Preview section", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText("Terminal Preview")).toBeDefined();
  });

  it("shows help command in terminal preview", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText("help")).toBeDefined();
  });

  it("shows success message in terminal preview", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(
      screen.getByText(/Available commands: about, projects, contact/i)
    ).toBeDefined();
  });

  it("shows error message in terminal preview", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(
      screen.getByText(/Command not found/i)
    ).toBeDefined();
  });

  it("renders Edit button for non-built-in themes", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText("✏️ Edit")).toBeDefined();
  });

  it("does not render Edit button for built-in themes", () => {
    render(
      <ThemePreview
        theme={builtInTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(screen.queryByText("✏️ Edit")).toBeNull();
  });

  it("renders Apply button", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText("✅ Apply")).toBeDefined();
  });

  it("calls onEdit when Edit button is clicked", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    fireEvent.click(screen.getByText("✏️ Edit"));

    expect(mockOnEdit).toHaveBeenCalled();
  });

  it("calls onApply when Apply button is clicked", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    fireEvent.click(screen.getByText("✅ Apply"));

    expect(mockOnApply).toHaveBeenCalled();
  });

  it("renders Accessibility Notes section", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText("Accessibility Notes")).toBeDefined();
  });

  it("shows contrast ratio info", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText(/Contrast Ratio/i)).toBeDefined();
  });

  it("applies preview theme colors to terminal section", () => {
    render(
      <ThemePreview
        theme={mockTheme}
        onEdit={mockOnEdit}
        onApply={mockOnApply}
      />
    );

    const terminalPreview = screen
      .getByText("Terminal Preview")
      .parentElement?.querySelector("div.font-mono");
    expect(terminalPreview).toBeDefined();
    // Terminal should use the theme's background color
    expect((terminalPreview as HTMLElement)?.style.backgroundColor).toBe(
      mockTheme.colors.bg
    );
  });
});
