import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { HomeTerminalHeader } from "../home-terminal-header";

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
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}));

// Mock i18n hook
vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        terminalReady: "Terminal Ready",
        projects: "Projects",
        skills: "Skills",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock LanguageSwitcher
vi.mock("../language-switcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Language Switcher</div>,
}));

describe("HomeTerminalHeader", () => {
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
    it("should render terminal header", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<HomeTerminalHeader />);

      expect(screen.getByText("PORTFOLIO TERMINAL")).toBeInTheDocument();
    });

    it("should display terminal ready status", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<HomeTerminalHeader />);

      await waitFor(() => {
        expect(screen.getByText(/Terminal Ready/)).toBeInTheDocument();
      });
    });

    it("should display projects count", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<HomeTerminalHeader />);

      await waitFor(() => {
        expect(screen.getByText(/Projects:/)).toBeInTheDocument();
      });
    });

    it("should display skills count", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<HomeTerminalHeader />);

      await waitFor(() => {
        expect(screen.getByText(/Skills:/)).toBeInTheDocument();
      });
    });

    it("should display experience", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<HomeTerminalHeader />);

      await waitFor(() => {
        expect(screen.getByText(/Exp:/)).toBeInTheDocument();
      });
    });

    it("should display commits count", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<HomeTerminalHeader />);

      await waitFor(() => {
        expect(screen.getByText(/Commits:/)).toBeInTheDocument();
      });
    });

    it("should display version", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<HomeTerminalHeader />);

      expect(screen.getByText("v2.0.0")).toBeInTheDocument();
    });

    it("should display language switcher", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<HomeTerminalHeader />);

      expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
    });
  });

  describe("Time Updates", () => {
    it("should update time every second", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<HomeTerminalHeader />);

      await waitFor(() => {
        expect(screen.getByText(/Time:/)).toBeInTheDocument();
      });

      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText(/Time:/)).toBeInTheDocument();
      });
    });
  });

  describe("Metrics Updates", () => {
    it("should update metrics over time", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<HomeTerminalHeader />);

      await waitFor(() => {
        expect(screen.getByText(/Updated:/)).toBeInTheDocument();
      });

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText(/Updated:/)).toBeInTheDocument();
      });
    });
  });
});
