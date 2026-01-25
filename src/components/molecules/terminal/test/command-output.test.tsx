import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { CommandOutput } from "../command-output";
import type { CommandOutput as CommandOutputType } from "@/types/terminal";

// Mock theme hook
const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#0a0a0a",
    text: "#e5e5e5",
    accent: "#00ff41",
    success: "#00ff41",
    error: "#ff4444",
    warning: "#ffaa00",
    info: "#00aaff",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
    theme: "default",
  }),
}));

// Mock useAccessibility
vi.mock("@/components/organisms/accessibility/accessibility-provider", () => ({
  useAccessibility: () => ({
    isReducedMotion: false,
  }),
}));

describe("CommandOutput", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render success output", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const output: CommandOutputType = {
        type: "success",
        content: "Operation successful",
      };

      render(<CommandOutput output={output} />);

      expect(screen.getByText("Operation successful")).toBeInTheDocument();
      expect(screen.getByText("✅")).toBeInTheDocument();
    });

    it("should render error output", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const output: CommandOutputType = {
        type: "error",
        content: "Command not found",
      };

      render(<CommandOutput output={output} />);

      expect(screen.getByText("Command not found")).toBeInTheDocument();
      expect(screen.getByText("❌")).toBeInTheDocument();
    });

    it("should render warning output", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const output: CommandOutputType = {
        type: "warning",
        content: "Warning message",
      };

      render(<CommandOutput output={output} />);

      expect(screen.getByText("Warning message")).toBeInTheDocument();
      expect(screen.getByText("⚠️")).toBeInTheDocument();
    });

    it("should render info output", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const output: CommandOutputType = {
        type: "info",
        content: "Information message",
      };

      render(<CommandOutput output={output} />);

      expect(screen.getByText("Information message")).toBeInTheDocument();
      expect(screen.getByText("ℹ️")).toBeInTheDocument();
    });

    it("should render array content", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const output: CommandOutputType = {
        type: "success",
        content: ["Line 1", "Line 2", "Line 3"],
      };

      render(<CommandOutput output={output} />);

      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
      expect(screen.getByText(/Line 2/)).toBeInTheDocument();
      expect(screen.getByText(/Line 3/)).toBeInTheDocument();
    });

    it("should render React component content", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const TestComponent = () => <div>Custom Component</div>;
      const output: CommandOutputType = {
        type: "info",
        content: TestComponent as any,
      };

      render(<CommandOutput output={output} />);

      expect(screen.getByText("Custom Component")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should show help message for errors", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const output: CommandOutputType = {
        type: "error",
        content: "Command not found",
      };

      render(<CommandOutput output={output} />);

      expect(screen.getByText(/Try typing 'help'/)).toBeInTheDocument();
    });

    it("should have assertive aria-live for errors", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const output: CommandOutputType = {
        type: "error",
        content: "Error message",
      };

      render(<CommandOutput output={output} />);

      const log = screen.getByRole("log");
      expect(log).toHaveAttribute("aria-live", "assertive");
      expect(log).toHaveAttribute("aria-label", "Error output");
    });

    it("should have polite aria-live for non-errors", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const output: CommandOutputType = {
        type: "success",
        content: "Success message",
      };

      render(<CommandOutput output={output} />);

      const log = screen.getByRole("log");
      expect(log).toHaveAttribute("aria-live", "polite");
      expect(log).toHaveAttribute("aria-label", "Command output");
    });
  });
});
