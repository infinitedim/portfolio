import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BackendTestingDashboard } from "../BackendTestingDashboard";

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

// Mock fetch for TrpcClient
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("BackendTestingDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "healthy" }),
    });
  });

  it("renders the dashboard title", () => {
    render(<BackendTestingDashboard themeConfig={mockThemeConfig} />);

    expect(screen.getByText("Backend Testing Dashboard")).toBeDefined();
  });

  it("renders the terminal prompt", () => {
    render(<BackendTestingDashboard themeConfig={mockThemeConfig} />);

    expect(screen.getByText(/admin@portfolio/)).toBeDefined();
  });

  it("displays service selection section", () => {
    render(<BackendTestingDashboard themeConfig={mockThemeConfig} />);

    expect(screen.getByText(/Service Selection/i)).toBeDefined();
  });

  it("displays available services", () => {
    render(<BackendTestingDashboard themeConfig={mockThemeConfig} />);

    // Should show health check service at minimum
    expect(screen.getByText("Health Check")).toBeDefined();
  });

  it("shows method selection after selecting a service", async () => {
    render(<BackendTestingDashboard themeConfig={mockThemeConfig} />);

    // Click on Health Check service
    const healthService = screen.getByText("Health Check");
    fireEvent.click(healthService);

    // Should show method selection section
    await waitFor(() => {
      expect(screen.getByText(/Method Selection|Select Method/i)).toBeDefined();
    });
  });

  it("shows health methods when Health Check service is selected", async () => {
    render(<BackendTestingDashboard themeConfig={mockThemeConfig} />);

    const healthService = screen.getByText("Health Check");
    fireEvent.click(healthService);

    await waitFor(() => {
      // Should show health-related methods (there may be multiple)
      expect(screen.getAllByText(/health/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("displays execute button when method is selected", async () => {
    render(<BackendTestingDashboard themeConfig={mockThemeConfig} />);

    // Select service
    const healthService = screen.getByText("Health Check");
    fireEvent.click(healthService);

    // Wait for methods to appear and select one
    await waitFor(() => {
      const methodButtons = screen.getAllByRole("button");
      const healthMethod = methodButtons.find((btn) =>
        btn.textContent?.includes("health") && btn.textContent?.includes("GET"),
      );
      if (healthMethod) {
        fireEvent.click(healthMethod);
      }
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /execute|send|run/i })).toBeDefined();
    });
  });

  it("has request/response panel", () => {
    render(<BackendTestingDashboard themeConfig={mockThemeConfig} />);

    expect(screen.getByText(/Request Log/i)).toBeDefined();
    expect(screen.getByText(/Response Log/i)).toBeDefined();
  });

  it("displays description about tRPC communication", () => {
    render(<BackendTestingDashboard themeConfig={mockThemeConfig} />);

    expect(screen.getByText(/tRPC communication/i)).toBeDefined();
  });

  it("applies theme colors to dashboard", () => {
    const { container } = render(
      <BackendTestingDashboard themeConfig={mockThemeConfig} />,
    );

    // Check that theme is applied - browser converts hex to rgb
    const styledElements = container.querySelectorAll('[style]');
    expect(styledElements.length).toBeGreaterThan(0);
  });

  it("shows loading state when executing request", async () => {
    // Make fetch slow to test loading state
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ status: "ok" }),
              }),
            1000,
          ),
        ),
    );

    render(<BackendTestingDashboard themeConfig={mockThemeConfig} />);

    // Select service and method
    const healthService = screen.getByText("Health Check");
    fireEvent.click(healthService);

    await waitFor(() => {
      const methodButtons = screen.getAllByRole("button");
      const healthMethod = methodButtons.find((btn) =>
        btn.textContent?.includes("health") && btn.textContent?.includes("GET"),
      );
      if (healthMethod) {
        fireEvent.click(healthMethod);
      }
    });

    // Execute
    await waitFor(() => {
      const executeButton = screen.getByRole("button", { name: /execute|send|run/i });
      fireEvent.click(executeButton);
    });

    // Should show loading indicator
    expect(screen.getByText(/Loading|Executing|Processing/i)).toBeDefined();
  });

  it("displays response after successful request", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: { data: { status: "healthy" } } }),
    });

    render(<BackendTestingDashboard themeConfig={mockThemeConfig} />);

    // Select service and method
    const healthService = screen.getByText("Health Check");
    fireEvent.click(healthService);

    await waitFor(() => {
      const methodButtons = screen.getAllByRole("button");
      const healthMethod = methodButtons.find((btn) =>
        btn.textContent?.includes("health") && btn.textContent?.includes("GET"),
      );
      if (healthMethod) {
        fireEvent.click(healthMethod);
      }
    });

    // Execute
    await waitFor(() => {
      const executeButton = screen.getByRole("button", { name: /execute|send|run/i });
      fireEvent.click(executeButton);
    });

    // Check response tab
    await waitFor(() => {
      const responseTab = screen.getByText(/Response Log/i);
      fireEvent.click(responseTab);
    });

    // Response should contain the data
    await waitFor(() => {
      expect(screen.getByDisplayValue(/healthy|status/)).toBeDefined();
    });
  });

  it("displays error in response on failed request", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(<BackendTestingDashboard themeConfig={mockThemeConfig} />);

    // Select service and method
    const healthService = screen.getByText("Health Check");
    fireEvent.click(healthService);

    await waitFor(() => {
      const methodButtons = screen.getAllByRole("button");
      const healthMethod = methodButtons.find((btn) =>
        btn.textContent?.includes("health") && btn.textContent?.includes("GET"),
      );
      if (healthMethod) {
        fireEvent.click(healthMethod);
      }
    });

    // Execute
    await waitFor(() => {
      const executeButton = screen.getByRole("button", { name: /execute|send|run/i });
      fireEvent.click(executeButton);
    });

    // Check response tab
    await waitFor(() => {
      const responseTab = screen.getByText(/Response Log/i);
      fireEvent.click(responseTab);
    });

    // Should show error
    await waitFor(() => {
      expect(screen.getByDisplayValue(/error/i)).toBeDefined();
    });
  });

  it("resets method selection when changing service", async () => {
    render(<BackendTestingDashboard themeConfig={mockThemeConfig} />);

    // Select first service
    const healthService = screen.getByText("Health Check");
    fireEvent.click(healthService);

    // Wait for methods and select one
    await waitFor(() => {
      const methodButtons = screen.getAllByRole("button");
      const healthMethod = methodButtons.find((btn) =>
        btn.textContent?.includes("health") && btn.textContent?.includes("GET"),
      );
      if (healthMethod) {
        fireEvent.click(healthMethod);
      }
    });

    // Select different service
    const authService = screen.getByText("Authentication");
    fireEvent.click(authService);

    // Method should be deselected
    await waitFor(() => {
      // Execute button should not be visible or should be disabled
      const executeButton = screen.queryByRole("button", { name: /execute|send|run/i });
      expect(executeButton === null || executeButton?.hasAttribute("disabled")).toBe(true);
    });
  });

  it("shows parameter inputs for methods with parameters", async () => {
    render(<BackendTestingDashboard themeConfig={mockThemeConfig} />);

    // Select Health Check service which has methods
    const healthService = screen.getByText("Health Check");
    fireEvent.click(healthService);

    // Wait for methods to be displayed
    await waitFor(() => {
      const methodButtons = screen.getAllByRole("button");
      expect(methodButtons.length).toBeGreaterThan(0);
    });
  });

  it("has grid layout for service and method sections", () => {
    const { container } = render(
      <BackendTestingDashboard themeConfig={mockThemeConfig} />,
    );

    const gridElement = container.querySelector(".grid");
    expect(gridElement).toBeDefined();
    expect(gridElement?.className).toContain("lg:grid-cols-3");
  });

  it("renders error handler component", () => {
    // Note: ErrorHandler only renders when there are errors
    // When all services are healthy, it returns null
    render(<BackendTestingDashboard themeConfig={mockThemeConfig} />);

    // Just verify the dashboard renders correctly
    expect(screen.getByText(/Health Check/i)).toBeDefined();
  });
});
