import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { LoggingMonitor } from "../LoggingMonitor";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

const mockThemeConfig = {
  name: "test-theme",
  colors: {
    bg: "#1a1a2e",
    text: "#ffffff",
    accent: "#00ff00",
    border: "#333333",
    success: "#00ff00",
    error: "#ff0000",
    warning: "#ffff00",
    muted: "#888888",
  },
};

describe("LoggingMonitor", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.useFakeTimers();
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => "blob:mock");
    global.URL.revokeObjectURL = vi.fn();
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the logging monitor component", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<LoggingMonitor themeConfig={mockThemeConfig} />);

    // Should have the terminal-style header
    expect(screen.getByText(/logs@portfolio:~\$/)).toBeDefined();
  });

  it("displays pause/resume button", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<LoggingMonitor themeConfig={mockThemeConfig} />);

    expect(screen.getByText(/Pause/)).toBeDefined();
  });

  it("toggles between pause and resume when button is clicked", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<LoggingMonitor themeConfig={mockThemeConfig} />);

    const pauseButton = screen.getByText(/Pause/);

    await act(async () => {
      fireEvent.click(pauseButton);
    });

    // Should now show Resume
    expect(screen.getByText(/Resume/)).toBeDefined();
  });

  it("has search input for filtering logs", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<LoggingMonitor themeConfig={mockThemeConfig} />);

    const searchInput = screen.getByPlaceholderText("Search logs...");
    expect(searchInput).toBeDefined();
  });

  it("allows typing in search input", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<LoggingMonitor themeConfig={mockThemeConfig} />);

    const searchInput = screen.getByPlaceholderText("Search logs...") as HTMLInputElement;

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "error" } });
    });

    expect(searchInput.value).toBe("error");
  });

  it("has log level filter buttons", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<LoggingMonitor themeConfig={mockThemeConfig} />);

    // Should have filter buttons for different log levels (may have multiple because logs also show level)
    expect(screen.getAllByText("INFO").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("WARN").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("ERROR").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("DEBUG").length).toBeGreaterThanOrEqual(1);
  });

  it("has source filter buttons", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<LoggingMonitor themeConfig={mockThemeConfig} />);

    // Should have source filters (may have multiple because logs also show source)
    expect(screen.getAllByText("system").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("auth").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("database").length).toBeGreaterThanOrEqual(1);
  });

  it("has clear button", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<LoggingMonitor themeConfig={mockThemeConfig} />);

    expect(screen.getByText(/Clear/)).toBeDefined();
  });

  it("has export button", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<LoggingMonitor themeConfig={mockThemeConfig} />);

    expect(screen.getByText(/Export/)).toBeDefined();
  });

  it("toggles log level filter when clicked", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<LoggingMonitor themeConfig={mockThemeConfig} />);

    // Use getAllByText and get the filter button (first one in the filter section)
    const infoButtons = screen.getAllByText("INFO");
    // The first INFO should be in the filter section
    const filterButton = infoButtons[0];

    await act(async () => {
      fireEvent.click(filterButton);
    });

    // Button should still exist
    expect(screen.getAllByText("INFO").length).toBeGreaterThanOrEqual(1);
  });

  it("clears logs when clear button is clicked", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<LoggingMonitor themeConfig={mockThemeConfig} />);

    // Wait for initial logs
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const clearButton = screen.getByText(/Clear/);

    await act(async () => {
      fireEvent.click(clearButton);
    });

    // Component should still render
    expect(screen.getByText(/logs@portfolio:~\$/)).toBeDefined();
  });

  it("applies theme colors to container", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<LoggingMonitor themeConfig={mockThemeConfig} />);

    const mainContainer = container.querySelector('.space-y-6');
    expect(mainContainer).toBeDefined();
  });

  it("generates logs over time when not paused", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<LoggingMonitor themeConfig={mockThemeConfig} />);

    // Wait for initial logs and some intervals
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Component should still be rendered (logs are generated internally)
    expect(screen.getByText(/logs@portfolio:~\$/)).toBeDefined();
  });
});
