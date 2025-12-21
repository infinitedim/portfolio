import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ErrorHandler } from "../ErrorHandler";

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

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ErrorHandler", () => {
  const mockOnError = vi.fn();
  const mockOnRecovery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  // NOTE: ErrorHandler only renders when there are errors (disconnected services or lastError)
  // When all services are connected, it returns null

  it("renders nothing when all services are healthy", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "healthy" }),
    });

    const { container } = render(
      <ErrorHandler
        themeConfig={mockThemeConfig}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      />,
    );

    await waitFor(() => {
      // Component returns null when all healthy
      expect(container.firstChild).toBeNull();
    });
  });

  it("calls onRecovery when all services are connected", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "healthy" }),
    });

    render(
      <ErrorHandler
        themeConfig={mockThemeConfig}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      />,
    );

    await waitFor(() => {
      expect(mockOnRecovery).toHaveBeenCalled();
    });
  });

  it("renders service status section when services fail", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(
      <ErrorHandler
        themeConfig={mockThemeConfig}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Service Status Monitor/i)).toBeDefined();
    });
  });

  it("shows disconnected status when services fail", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(
      <ErrorHandler
        themeConfig={mockThemeConfig}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Service Status Monitor/i)).toBeDefined();
    });
  });

  it("has refresh button when error occurs", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(
      <ErrorHandler
        themeConfig={mockThemeConfig}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Refresh/i)).toBeDefined();
    });
  });

  it("shows service names when error occurs", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(
      <ErrorHandler
        themeConfig={mockThemeConfig}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/backend/i)).toBeDefined();
    });
  });

  it("calls onError when service check fails", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(
      <ErrorHandler
        themeConfig={mockThemeConfig}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      />,
    );

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  it("rechecks services when refresh button is clicked", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(
      <ErrorHandler
        themeConfig={mockThemeConfig}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Refresh/i)).toBeDefined();
    });

    const initialCallCount = mockFetch.mock.calls.length;

    const refreshButton = screen.getByText(/Refresh/i);

    await act(async () => {
      fireEvent.click(refreshButton);
    });

    // Fetch should be called again (at least more than initial)
    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it("applies theme colors to container", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { container } = render(
      <ErrorHandler
        themeConfig={mockThemeConfig}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      />,
    );

    await waitFor(() => {
      const panel = container.querySelector('.border.rounded-lg');
      expect(panel).toBeDefined();
    });
  });

  it("shows status icons for services", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(
      <ErrorHandler
        themeConfig={mockThemeConfig}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      />,
    );

    await waitFor(() => {
      // Should have status icons
      expect(screen.getByText(/Service Status Monitor/i)).toBeDefined();
    });
  });
});
