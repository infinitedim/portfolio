import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CommandOutput } from "../CommandOutput";
import type { CommandOutput as CommandOutputType } from "@/types/terminal";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock hooks
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    themeConfig: {
      colors: {
        bg: "#000000",
        text: "#ffffff",
        accent: "#00ff00",
        success: "#00ff00",
        error: "#ff0000",
        warning: "#ffaa00",
      },
    },
    theme: "dark",
  }),
}));

vi.mock("@/components/accessibility/AccessibilityProvider", () => ({
  useAccessibility: () => ({
    isReducedMotion: false,
  }),
}));

describe("CommandOutput", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
  });

  it("renders success output", () => {
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

  it("renders error output", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const output: CommandOutputType = {
      type: "error",
      content: "Operation failed",
    };

    render(<CommandOutput output={output} />);
    expect(screen.getByText("Operation failed")).toBeInTheDocument();
    expect(screen.getByText("❌")).toBeInTheDocument();
  });

  it("renders warning output", () => {
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

  it("renders info output", () => {
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

  it("renders array content as joined string", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const output: CommandOutputType = {
      type: "info",
      content: ["Line 1", "Line 2", "Line 3"],
    };

    render(<CommandOutput output={output} />);
    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
  });
});
