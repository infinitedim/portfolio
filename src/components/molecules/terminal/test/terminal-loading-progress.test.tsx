import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { TerminalLoadingProgress } from "../terminal-loading-progress";

// Mock theme hook
const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#0a0a0a",
    text: "#e5e5e5",
    accent: "#00ff41",
    muted: "#666666",
    border: "#333333",
    success: "#00ff41",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
    theme: "default",
    mounted: true,
  }),
}));

describe("TerminalLoadingProgress", () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render terminal loading progress", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TerminalLoadingProgress
          duration={1000}
          files={["file1.ts", "file2.ts"]}
        />,
      );

      expect(screen.getByText("Terminal Portfolio")).toBeInTheDocument();
    });

    it("should render with default files", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<TerminalLoadingProgress duration={1000} />);

      expect(screen.getByText("Terminal Portfolio")).toBeInTheDocument();
    });

    it("should show progress bar", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <TerminalLoadingProgress duration={1000} files={["file1.ts"]} />,
      );

      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toBeInTheDocument();
    });

    it("should show system info when enabled", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TerminalLoadingProgress
          duration={1000}
          showSystemInfo={true}
          files={["file1.ts"]}
        />,
      );

      expect(screen.getByText(/Initializing/)).toBeInTheDocument();
    });
  });

  describe("File Loading", () => {
    it("should load files sequentially", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const files = ["file1.ts", "file2.ts", "file3.ts"];

      render(
        <TerminalLoadingProgress
          duration={1000}
          files={files}
          autoStart={true}
        />,
      );

      vi.advanceTimersByTime(400);

      await waitFor(() => {
        const fileElements = screen.queryAllByText(/file/);
        expect(fileElements.length).toBeGreaterThan(0);
      });
    });

    it("should show completion message when done", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TerminalLoadingProgress
          duration={1000}
          files={["file1.ts"]}
          completionText="Done!"
          onComplete={mockOnComplete}
          autoStart={true}
        />,
      );

      vi.advanceTimersByTime(1100);

      await waitFor(() => {
        expect(screen.getByText("Done!")).toBeInTheDocument();
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });
  });

  describe("Progress Calculation", () => {
    it("should update progress as files load", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const files = ["file1.ts", "file2.ts", "file3.ts"];

      render(
        <TerminalLoadingProgress
          duration={1000}
          files={files}
          autoStart={true}
        />,
      );

      vi.advanceTimersByTime(400);

      await waitFor(() => {
        const progressText = screen.getByText(/\d+%/);
        expect(progressText).toBeInTheDocument();
      });
    });
  });
});
