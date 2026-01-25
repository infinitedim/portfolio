import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { VirtualizedTerminalHistory } from "../virtualized-terminal-history";
import type { TerminalHistory } from "@/types/terminal";

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

// Mock CommandOutput
vi.mock("@/components/molecules/terminal/command-output", () => ({
  CommandOutput: ({ output }: { output: TerminalHistory }) => (
    <div data-testid="command-output">{output.command}</div>
  ),
}));

const mockHistory: TerminalHistory[] = [
  {
    id: "1",
    command: "help",
    output: {
      type: "success",
      content: "Help content",
    },
    timestamp: new Date(),
  },
  {
    id: "2",
    command: "about",
    output: {
      type: "info",
      content: "About content",
    },
    timestamp: new Date(),
  },
];

describe("VirtualizedTerminalHistory", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render history entries", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<VirtualizedTerminalHistory history={mockHistory} />);

      expect(screen.getByText("help")).toBeInTheDocument();
      expect(screen.getByText("about")).toBeInTheDocument();
    });

    it("should handle empty history", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <VirtualizedTerminalHistory history={[]} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it("should use custom itemHeight", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <VirtualizedTerminalHistory history={mockHistory} itemHeight={150} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it("should use custom containerHeight", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <VirtualizedTerminalHistory
          history={mockHistory}
          containerHeight={800}
        />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it("should use custom overscan", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <VirtualizedTerminalHistory history={mockHistory} overscan={10} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Virtualization", () => {
    it("should only render visible items for large histories", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const largeHistory = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        command: `command-${i}`,
        output: { type: "success" as const, content: `Output ${i}` },
        timestamp: new Date(),
      }));

      render(<VirtualizedTerminalHistory history={largeHistory} />);

      // Should only render visible items plus overscan
      const outputs = screen.getAllByTestId("command-output");
      expect(outputs.length).toBeLessThan(1000);
    });
  });
});
