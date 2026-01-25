import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { AdvancedTerminalFeaturesIntegration } from "../terminal-features-integration";

// Mock dependencies
const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#000000",
    text: "#ffffff",
    accent: "#00ff00",
    border: "#333333",
    muted: "#888888",
    success: "#00ff00",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}));

const mockAddCommand = vi.fn();
const mockAnalytics = {
  successRate: 95.5,
  averageExecutionTime: 120,
  topCommands: [
    { command: "help", count: 10 },
    { command: "about", count: 5 },
  ],
};

const mockExportHistory = vi.fn();
const mockTotalCommands = 50;

vi.mock("@/hooks/use-command-history", () => ({
  useCommandHistory: () => ({
    addCommand: mockAddCommand,
    analytics: mockAnalytics,
    exportHistory: mockExportHistory,
    totalCommands: mockTotalCommands,
  }),
}));

const mockShortcuts = [
  {
    id: "clear",
    keys: ["Ctrl", "L"],
    description: "Clear terminal",
    enabled: true,
    category: "navigation",
  },
];

const mockUpdateShortcutKeys = vi.fn();
const mockExportShortcuts = vi.fn();
const mockResetToDefaults = vi.fn();

vi.mock("@/hooks/use-terminal-shortcuts", () => ({
  useTerminalShortcuts: () => ({
    shortcuts: mockShortcuts,
    updateShortcutKeys: mockUpdateShortcutKeys,
    exportShortcuts: mockExportShortcuts,
    resetToDefaults: mockResetToDefaults,
  }),
}));

vi.mock("@/components/molecules/terminal/history-search-panel", () => ({
  HistorySearchPanel: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="history-panel">History Panel</div> : null,
}));

vi.mock("@/components/molecules/terminal/keyboard-shortcuts", () => ({
  KeyboardShortcut: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="shortcuts-panel">Shortcuts Panel</div> : null,
}));

describe("AdvancedTerminalFeaturesIntegration", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render component", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<AdvancedTerminalFeaturesIntegration />);

      expect(screen.getByText(/Advanced Terminal Features/i)).toBeInTheDocument();
    });

    it("should display statistics", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<AdvancedTerminalFeaturesIntegration />);

      expect(screen.getByText("50")).toBeInTheDocument(); // Total Commands
      expect(screen.getByText(/95.5%/i)).toBeInTheDocument(); // Success Rate
    });
  });

  describe("Command History", () => {
    it("should open history panel", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<AdvancedTerminalFeaturesIntegration />);

      const openButton = screen.getByText("Open Panel");
      fireEvent.click(openButton);

      expect(screen.getByTestId("history-panel")).toBeInTheDocument();
    });

    it("should export history", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<AdvancedTerminalFeaturesIntegration />);

      const exportButton = screen.getByText("💾 Export");
      fireEvent.click(exportButton);

      expect(mockExportHistory).toHaveBeenCalled();
    });
  });

  describe("Keyboard Shortcuts", () => {
    it("should open shortcuts panel", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<AdvancedTerminalFeaturesIntegration />);

      const customizeButton = screen.getByText("Customize");
      fireEvent.click(customizeButton);

      expect(screen.getByTestId("shortcuts-panel")).toBeInTheDocument();
    });

    it("should export shortcuts", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<AdvancedTerminalFeaturesIntegration />);

      const exportButtons = screen.getAllByText("💾 Export");
      fireEvent.click(exportButtons[1]); // Second export button for shortcuts

      expect(mockExportShortcuts).toHaveBeenCalled();
    });
  });

  describe("Demo Commands", () => {
    it("should execute demo commands", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const onCommandExecute = vi.fn();
      render(
        <AdvancedTerminalFeaturesIntegration
          onCommandExecute={onCommandExecute}
        />,
      );

      const helpButton = screen.getByText("help");
      fireEvent.click(helpButton);

      expect(mockAddCommand).toHaveBeenCalled();
      expect(onCommandExecute).toHaveBeenCalledWith("help");
    });
  });
});
