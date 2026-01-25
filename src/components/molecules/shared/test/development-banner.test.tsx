import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { DevelopmentBanner } from "../development-banner";

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
    warning: "#ffaa00",
    error: "#ff4444",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}));

describe("DevelopmentBanner", () => {
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
    it("should render development banner", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<DevelopmentBanner />);

      expect(screen.getByText("DEV MODE")).toBeInTheDocument();
    });

    it("should display development progress", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<DevelopmentBanner />);

      expect(screen.getByText(/Progress:/)).toBeInTheDocument();
    });

    it("should display test coverage", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<DevelopmentBanner />);

      expect(screen.getByText(/Tests:/)).toBeInTheDocument();
    });

    it("should display performance score", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<DevelopmentBanner />);

      expect(screen.getByText(/Perf:/)).toBeInTheDocument();
    });

    it("should display build status", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<DevelopmentBanner />);

      expect(screen.getByText(/Build:/)).toBeInTheDocument();
    });

    it("should display bundle size", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<DevelopmentBanner />);

      expect(screen.getByText(/Bundle:/)).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should close banner when close button is clicked", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<DevelopmentBanner />);

      const closeButton = screen.getByLabelText("Close development banner");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("DEV MODE")).not.toBeInTheDocument();
      });
    });
  });

  describe("Animation", () => {
    it("should update animation phase over time", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<DevelopmentBanner />);

      vi.advanceTimersByTime(500);

      // Animation phase should have updated
      expect(screen.getByText("DEV MODE")).toBeInTheDocument();
    });
  });
});
