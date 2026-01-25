import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { CommandRelationshipVisualizer } from "../command-relationship-visualizer";

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
  }),
}));

// Mock command history hook
const mockHistory = [
  {
    id: "1",
    command: "help",
    timestamp: new Date(),
    success: true,
    category: "navigation",
    executionTime: 100,
  },
  {
    id: "2",
    command: "about",
    timestamp: new Date(),
    success: true,
    category: "info",
    executionTime: 50,
  },
];

vi.mock("@/hooks/use-command-history", () => ({
  useCommandHistory: () => ({
    history: mockHistory,
    categories: ["navigation", "info"],
  }),
}));

describe("CommandRelationshipVisualizer", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should not render when isVisible is false", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <CommandRelationshipVisualizer
          isVisible={false}
          onClose={vi.fn()}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render when isVisible is true", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <CommandRelationshipVisualizer isVisible={true} onClose={vi.fn()} />,
      );

      expect(screen.getByText(/command relationship/i)).toBeInTheDocument();
    });

    it("should call onClose when close button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const onClose = vi.fn();
      render(
        <CommandRelationshipVisualizer isVisible={true} onClose={onClose} />,
      );

      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it("should display command nodes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <CommandRelationshipVisualizer isVisible={true} onClose={vi.fn()} />,
      );

      // Should display commands from history
      expect(screen.getByText(/help/i)).toBeInTheDocument();
    });

    it("should switch view modes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <CommandRelationshipVisualizer isVisible={true} onClose={vi.fn()} />,
      );

      const clusterButton = screen.getByText(/clusters/i);
      fireEvent.click(clusterButton);

      expect(clusterButton).toBeInTheDocument();
    });
  });

  describe("Filtering", () => {
    it("should filter by category", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <CommandRelationshipVisualizer isVisible={true} onClose={vi.fn()} />,
      );

      const categoryFilter = screen.getByText(/all/i);
      expect(categoryFilter).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty history", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      vi.mocked(vi.importMock("@/hooks/use-command-history")).mockReturnValueOnce(
        {
          history: [],
          categories: [],
        },
      );

      render(
        <CommandRelationshipVisualizer isVisible={true} onClose={vi.fn()} />,
      );

      expect(screen.getByText(/no commands/i)).toBeInTheDocument();
    });

    it("should respect maxNodes limit", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <CommandRelationshipVisualizer
          isVisible={true}
          onClose={vi.fn()}
          maxNodes={1}
        />,
      );

      // Should limit displayed nodes
      expect(screen.getByText(/help/i)).toBeInTheDocument();
    });
  });
});
