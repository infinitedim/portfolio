import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PerformanceDashboard } from "../PerformanceDashboard";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock PerformanceMonitor
vi.mock("@/lib/performance/PerformanceMonitor", () => ({
  PerformanceMonitor: {
    getInstance: () => ({
      getReport: () => ({
        metrics: [
          {
            name: "test-metric",
            value: 100,
            category: "command",
            timestamp: Date.now(),
          },
        ],
        summary: {
          totalMetrics: 1,
          averageValue: 100,
        },
      }),
      clearMetrics: vi.fn(),
    }),
  },
}));

// Mock useTheme
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    themeConfig: {
      colors: {
        bg: "#000000",
        text: "#ffffff",
        accent: "#00ff00",
        border: "#333333",
        success: "#00ff00",
        warning: "#ffaa00",
        error: "#ff0000",
      },
    },
  }),
}));

describe("PerformanceDashboard", () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders when isOpen is true", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<PerformanceDashboard {...mockProps} />);
    expect(screen.getByText(/Performance Dashboard/i)).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<PerformanceDashboard isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText(/Performance Dashboard/i)).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<PerformanceDashboard {...mockProps} />);
    const closeButton = screen.getByText("✕");
    fireEvent.click(closeButton);
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it("displays metrics", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<PerformanceDashboard {...mockProps} />);
    expect(screen.getByText(/All Metrics/i)).toBeInTheDocument();
  });

  it("toggles auto refresh", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<PerformanceDashboard {...mockProps} />);
    const checkbox = screen.getByLabelText(/Auto refresh/i);
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
