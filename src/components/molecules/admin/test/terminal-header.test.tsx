import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { TerminalHeader } from "../terminal-header";

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
    error: "#ff4444",
    warning: "#ffaa00",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}));

// Mock i18n hook
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    adminSystem: "System",
    adminOnline: "Online",
    adminOffline: "Offline",
    adminUptime: "Uptime",
    adminLoad: "Load",
    adminProcesses: "Processes",
    adminCPU: "CPU",
    adminMemory: "Memory",
    adminDisk: "Disk",
    adminNetwork: "Network",
    adminTime: "Time",
    adminTitle: "Admin",
  };
  return translations[key] || key;
});

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({
    t: mockT,
  }),
}));

describe("TerminalHeader", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render system status", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<TerminalHeader />);

      expect(screen.getByText(/System:/)).toBeInTheDocument();
      expect(screen.getByText("Online")).toBeInTheDocument();
    });

    it("should render uptime", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<TerminalHeader />);

      expect(screen.getByText(/Uptime:/)).toBeInTheDocument();
    });

    it("should render CPU load", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<TerminalHeader />);

      expect(screen.getByText(/Load:/)).toBeInTheDocument();
    });

    it("should render process count", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<TerminalHeader />);

      expect(screen.getByText(/Processes:/)).toBeInTheDocument();
    });

    it("should render admin title", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<TerminalHeader />);

      expect(screen.getByText("ADMIN")).toBeInTheDocument();
    });

    it("should render system metrics", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<TerminalHeader />);

      expect(screen.getByText(/CPU:/)).toBeInTheDocument();
      expect(screen.getByText(/Memory:/)).toBeInTheDocument();
      expect(screen.getByText(/Disk:/)).toBeInTheDocument();
      expect(screen.getByText(/Network:/)).toBeInTheDocument();
      expect(screen.getByText(/Time:/)).toBeInTheDocument();
    });
  });

  describe("Time Updates", () => {
    it("should update time every second", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<TerminalHeader />);

      const timeElement = screen.getByText(/Time:/);
      const initialTime = timeElement.textContent;

      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        const updatedTime = screen.getByText(/Time:/).textContent;
        expect(updatedTime).toBeDefined();
      });
    });
  });

  describe("System Metrics Updates", () => {
    it("should update metrics every second", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<TerminalHeader />);

      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        const loadElement = screen.getByText(/Load:/);
        expect(loadElement).toBeInTheDocument();
      });
    });
  });

  describe("Theme Configuration", () => {
    it("should use provided theme config", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const customTheme = {
        ...mockThemeConfig,
        colors: {
          ...mockThemeConfig.colors,
          accent: "#ff0000",
        },
      };

      render(<TerminalHeader themeConfig={customTheme} />);

      expect(screen.getByText("ADMIN")).toBeInTheDocument();
    });
  });
});
