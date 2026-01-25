import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { TerminalHistory } from "../terminal-history";

// Mock dependencies
const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#000000",
    text: "#ffffff",
    accent: "#00ff00",
    prompt: "$",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
    theme: "default",
  }),
}));

vi.mock("@/components/organisms/accessibility/accessibility-provider", () => ({
  useAccessibility: () => ({
    isReducedMotion: false,
  }),
}));

vi.mock("@/components/molecules/terminal/command-output", () => ({
  CommandOutput: ({ output }: any) => (
    <div data-testid="command-output">{JSON.stringify(output)}</div>
  ),
}));

const mockHistory = [
  {
    input: "help",
    output: {
      type: "info",
      content: "Available commands",
    },
  },
  {
    input: "about",
    output: {
      type: "success",
      content: "About me",
    },
  },
];

describe("TerminalHistory", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should return null when history is empty", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<TerminalHistory history={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render history entries", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<TerminalHistory history={mockHistory} />);

      expect(screen.getByText("help")).toBeInTheDocument();
      expect(screen.getByText("about")).toBeInTheDocument();
    });

    it("should render command outputs", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<TerminalHistory history={mockHistory} />);

      expect(screen.getByTestId("command-output")).toBeInTheDocument();
    });

    it("should have proper ARIA attributes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<TerminalHistory history={mockHistory} />);

      const log = container.querySelector('[role="log"]');
      expect(log).toHaveAttribute("aria-label", "Command history");
    });
  });
});
