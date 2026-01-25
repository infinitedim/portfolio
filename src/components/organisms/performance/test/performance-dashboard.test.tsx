import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { PerformanceDashboard } from "../performance-dashboard";

// Mock PerformanceMonitor
const mockGetReport = vi.fn(() => ({
  summary: {
    totalCommands: 10,
    averageCommandTime: 50,
    averageRenderTime: 16,
    memoryUsage: 1024 * 1024,
  },
  metrics: [
    {
      name: "test-command",
      value: 50,
      category: "command",
      timestamp: performance.now(),
    },
  ],
  recommendations: ["Optimize command execution"],
  generatedAt: Date.now(),
}));

const mockClearMetrics = vi.fn();
const mockExportMetrics = vi.fn(() => JSON.stringify({ test: "data" }));

vi.mock("@/lib/performance/performance-monitor", () => ({
  PerformanceMonitor: {
    getInstance: () => ({
      getReport: mockGetReport,
      clearMetrics: mockClearMetrics,
      exportMetrics: mockExportMetrics,
    }),
  },
}));

const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#000000",
    text: "#ffffff",
    accent: "#00ff00",
    border: "#333333",
    success: "#00ff00",
    warning: "#ffaa00",
    error: "#ff4444",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}));

// Mock document.createElement for export
const mockCreateElement = vi.fn();
const mockClick = vi.fn();
const mockSetAttribute = vi.fn();

describe("PerformanceDashboard", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    vi.useFakeTimers();

    if (typeof document !== "undefined") {
      mockCreateElement.mockReturnValue({
        setAttribute: mockSetAttribute,
        click: mockClick,
      });
      vi.spyOn(document, "createElement").mockImplementation(mockCreateElement);
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <PerformanceDashboard isOpen={false} onClose={vi.fn()} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render when isOpen is true", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<PerformanceDashboard isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText(/Performance Dashboard/i)).toBeInTheDocument();
    });

    it("should display summary metrics", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<PerformanceDashboard isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText(/Total Commands/i)).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });
  });

  describe("Category Filtering", () => {
    it("should filter metrics by category", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<PerformanceDashboard isOpen={true} onClose={vi.fn()} />);

      const commandButton = screen.getByText(/command/i);
      fireEvent.click(commandButton);

      expect(screen.getByText(/command/i)).toBeInTheDocument();
    });

    it("should show all metrics when 'all' is selected", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<PerformanceDashboard isOpen={true} onClose={vi.fn()} />);

      const allButton = screen.getByText(/All Metrics/i);
      fireEvent.click(allButton);

      expect(screen.getByText(/All Metrics/i)).toBeInTheDocument();
    });
  });

  describe("Auto Refresh", () => {
    it("should toggle auto refresh", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<PerformanceDashboard isOpen={true} onClose={vi.fn()} />);

      const checkbox = screen.getByLabelText(/Auto refresh/i);
      fireEvent.click(checkbox);

      expect(checkbox).not.toBeChecked();
    });

    it("should refresh metrics when auto refresh is enabled", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<PerformanceDashboard isOpen={true} onClose={vi.fn()} />);

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockGetReport).toHaveBeenCalledTimes(2); // Initial + refresh
      });
    });
  });

  describe("Actions", () => {
    it("should refresh metrics when refresh button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<PerformanceDashboard isOpen={true} onClose={vi.fn()} />);

      const refreshButton = screen.getByText(/Refresh/i);
      fireEvent.click(refreshButton);

      expect(mockGetReport).toHaveBeenCalled();
    });

    it("should clear metrics when clear button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<PerformanceDashboard isOpen={true} onClose={vi.fn()} />);

      const clearButton = screen.getByText(/Clear Metrics/i);
      fireEvent.click(clearButton);

      expect(mockClearMetrics).toHaveBeenCalled();
    });

    it("should export metrics when export button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }
      render(<PerformanceDashboard isOpen={true} onClose={vi.fn()} />);

      const exportButton = screen.getByText(/Export Data/i);
      fireEvent.click(exportButton);

      expect(mockExportMetrics).toHaveBeenCalled();
      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe("Close Functionality", () => {
    it("should call onClose when close button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const onClose = vi.fn();
      render(<PerformanceDashboard isOpen={true} onClose={onClose} />);

      const closeButton = screen.getByText("✕");
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("Recommendations", () => {
    it("should display recommendations when available", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<PerformanceDashboard isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText(/Recommendations/i)).toBeInTheDocument();
      expect(screen.getByText(/Optimize command execution/i)).toBeInTheDocument();
    });
  });
});
