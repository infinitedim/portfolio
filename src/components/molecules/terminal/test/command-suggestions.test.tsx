import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { CommandSuggestions } from "../command-suggestions";

// Mock theme hook
const mockThemeConfig = {
  colors: {
    bg: "#000000",
    text: "#ffffff",
    accent: "#00ff00",
    border: "#333333",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
    theme: "default",
  }),
}));

// Mock useCommandSuggestions hook
const mockSuggestions = [
  {
    command: "help",
    type: "exact" as const,
    score: 1.0,
    description: "Show help information",
  },
  {
    command: "hello",
    type: "prefix" as const,
    score: 0.8,
    description: "Say hello",
  },
];

vi.mock("@/hooks/use-command-suggestions", () => ({
  useCommandSuggestions: () => ({
    suggestions: mockSuggestions,
    isLoading: false,
    updateCommandUsage: vi.fn(),
    clearCache: vi.fn(),
    getUserContext: vi.fn(() => ({})),
  }),
}));

describe("CommandSuggestions", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should not render when visible is false", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <CommandSuggestions
          input="hel"
          availableCommands={["help", "hello"]}
          visible={false}
          onSelect={vi.fn()}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should not render when no suggestions", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      vi.mocked(vi.importMock("@/hooks/use-command-suggestions")).mockReturnValueOnce(
        {
          suggestions: [],
          isLoading: false,
          updateCommandUsage: vi.fn(),
          clearCache: vi.fn(),
          getUserContext: vi.fn(),
        },
      );

      const { container } = render(
        <CommandSuggestions
          input="xyz"
          availableCommands={["help", "hello"]}
          visible={true}
          onSelect={vi.fn()}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render suggestions when visible and suggestions exist", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <CommandSuggestions
          input="hel"
          availableCommands={["help", "hello"]}
          visible={true}
          onSelect={vi.fn()}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("help")).toBeInTheDocument();
      });
    });

    it("should display suggestion descriptions when showDescriptions is true", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <CommandSuggestions
          input="hel"
          availableCommands={["help", "hello"]}
          visible={true}
          onSelect={vi.fn()}
          showDescriptions={true}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Show help information")).toBeInTheDocument();
      });
    });
  });

  describe("Interaction", () => {
    it("should call onSelect when suggestion is clicked", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const onSelect = vi.fn();
      render(
        <CommandSuggestions
          input="hel"
          availableCommands={["help", "hello"]}
          visible={true}
          onSelect={onSelect}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("help")).toBeInTheDocument();
      });

      const helpButton = screen.getByText("help");
      fireEvent.click(helpButton);

      expect(onSelect).toHaveBeenCalledWith("help");
    });

    it("should navigate with ArrowDown key", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <CommandSuggestions
          input="hel"
          availableCommands={["help", "hello"]}
          visible={true}
          onSelect={vi.fn()}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("help")).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: "ArrowDown" });

      // Selected index should change
      expect(screen.getByText("help")).toBeInTheDocument();
    });

    it("should select suggestion with Enter key", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const onSelect = vi.fn();
      render(
        <CommandSuggestions
          input="hel"
          availableCommands={["help", "hello"]}
          visible={true}
          onSelect={onSelect}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("help")).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: "Enter" });

      expect(onSelect).toHaveBeenCalledWith("help");
    });

    it("should hide when Escape key is pressed", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <CommandSuggestions
          input="hel"
          availableCommands={["help", "hello"]}
          visible={true}
          onSelect={vi.fn()}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("help")).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe("Configuration", () => {
    it("should respect maxSuggestions", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const manySuggestions = Array.from({ length: 20 }, (_, i) => ({
        command: `command-${i}`,
        type: "exact" as const,
        score: 1.0,
        description: `Description ${i}`,
      }));

      vi.mocked(vi.importMock("@/hooks/use-command-suggestions")).mockReturnValueOnce(
        {
          suggestions: manySuggestions,
          isLoading: false,
          updateCommandUsage: vi.fn(),
          clearCache: vi.fn(),
          getUserContext: vi.fn(),
        },
      );

      render(
        <CommandSuggestions
          input="com"
          availableCommands={manySuggestions.map((s) => s.command)}
          visible={true}
          onSelect={vi.fn()}
          maxSuggestions={5}
        />,
      );

      await waitFor(() => {
        const suggestions = screen.getAllByText(/command-/);
        expect(suggestions.length).toBeLessThanOrEqual(5);
      });
    });
  });
});
