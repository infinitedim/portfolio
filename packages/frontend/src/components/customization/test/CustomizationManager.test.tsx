import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomizationManager } from "../CustomizationManager";

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
    info: "#7dcfff",
    prompt: "#bb9af7",
  },
};

const mockChangeTheme = vi.fn().mockReturnValue(true);

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "dark",
    themeConfig: mockThemeConfig,
    changeTheme: mockChangeTheme,
  }),
}));

// Mock CustomizationService
const mockGetAllThemes = vi.fn().mockReturnValue([
  {
    id: "dark",
    name: "Dark Theme",
    source: "built-in",
    colors: mockThemeConfig.colors,
    createdAt: new Date(),
  },
  {
    id: "custom-1",
    name: "Custom Theme",
    source: "custom",
    colors: mockThemeConfig.colors,
    createdAt: new Date(),
  },
]);

const mockGetAllFonts = vi.fn().mockReturnValue([
  {
    id: "fira-code",
    name: "Fira Code",
    family: "Fira Code",
    source: "system",
    weight: "400",
    ligatures: true,
    createdAt: new Date(),
  },
]);

vi.mock("@/lib/services/customizationService", () => ({
  CustomizationService: {
    getInstance: () => ({
      getAllThemes: mockGetAllThemes,
      getAllFonts: mockGetAllFonts,
    }),
  },
}));

// Mock child components
vi.mock("../ThemeManager", () => ({
  ThemeManager: () => <div data-testid="theme-manager">ThemeManager</div>,
}));

vi.mock("../FontManager", () => ({
  FontManager: () => <div data-testid="font-manager">FontManager</div>,
}));

vi.mock("../SettingsManager", () => ({
  SettingsManager: () => <div data-testid="settings-manager">SettingsManager</div>,
}));

vi.mock("../ImportExportManager", () => ({
  ImportExportManager: () => (
    <div data-testid="import-export-manager">ImportExportManager</div>
  ),
}));

vi.mock("@/components/ui/TerminalLoadingProgress", () => ({
  TerminalLoadingProgress: () => <div data-testid="loading">Loading...</div>,
}));

describe("CustomizationManager", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when isOpen is false", () => {
    const { container } = render(
      <CustomizationManager isOpen={false} onClose={mockOnClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders modal when isOpen is true", () => {
    render(<CustomizationManager isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("🎨 Customization Manager")).toBeDefined();
  });

  it("displays modal header with description", () => {
    render(<CustomizationManager isOpen={true} onClose={mockOnClose} />);

    expect(
      screen.getByText(/Manage themes, fonts, and appearance settings/i)
    ).toBeDefined();
  });

  it("renders close button", () => {
    render(<CustomizationManager isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText("Close customization manager");
    expect(closeButton).toBeDefined();
  });

  it("calls onClose when close button is clicked", () => {
    render(<CustomizationManager isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText("Close customization manager");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape key is pressed", () => {
    render(<CustomizationManager isOpen={true} onClose={mockOnClose} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders all four tabs", () => {
    render(<CustomizationManager isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("🎨 Themes")).toBeDefined();
    expect(screen.getByText("🔤 Fonts")).toBeDefined();
    expect(screen.getByText("⚙️ Settings")).toBeDefined();
    expect(screen.getByText("📦 Import/Export")).toBeDefined();
  });

  it("shows ThemeManager by default", async () => {
    render(<CustomizationManager isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByTestId("theme-manager")).toBeDefined();
    });
  });

  it("switches to FontManager when fonts tab is clicked", async () => {
    render(<CustomizationManager isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByTestId("theme-manager")).toBeDefined();
    });

    const fontsTab = screen.getByText("🔤 Fonts");
    fireEvent.click(fontsTab);

    expect(screen.getByTestId("font-manager")).toBeDefined();
  });

  it("switches to SettingsManager when settings tab is clicked", async () => {
    render(<CustomizationManager isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByTestId("theme-manager")).toBeDefined();
    });

    const settingsTab = screen.getByText("⚙️ Settings");
    fireEvent.click(settingsTab);

    expect(screen.getByTestId("settings-manager")).toBeDefined();
  });

  it("switches to ImportExportManager when import/export tab is clicked", async () => {
    render(<CustomizationManager isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByTestId("theme-manager")).toBeDefined();
    });

    const importExportTab = screen.getByText("📦 Import/Export");
    fireEvent.click(importExportTab);

    expect(screen.getByTestId("import-export-manager")).toBeDefined();
  });

  it("shows custom theme count badge on themes tab", async () => {
    render(<CustomizationManager isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      // There's 1 custom theme in the mock
      expect(screen.getByText("1")).toBeDefined();
    });
  });

  it("loads data when opened", async () => {
    render(<CustomizationManager isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockGetAllThemes).toHaveBeenCalled();
      expect(mockGetAllFonts).toHaveBeenCalled();
    });
  });

  it("applies theme colors to modal", () => {
    render(<CustomizationManager isOpen={true} onClose={mockOnClose} />);

    const header = screen.getByText("🎨 Customization Manager");
    expect(header.style.color).toBe(mockThemeConfig.colors.accent);
  });

  it("has backdrop blur overlay", () => {
    const { container } = render(
      <CustomizationManager isOpen={true} onClose={mockOnClose} />
    );

    const overlay = container.firstChild as HTMLElement;
    expect(overlay.className).toContain("backdrop-blur");
  });

  it("shows current theme name in header", async () => {
    render(<CustomizationManager isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/Current theme: dark/i)).toBeDefined();
    });
  });
});
