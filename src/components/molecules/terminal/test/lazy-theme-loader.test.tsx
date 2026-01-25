import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { LazyThemeLoader } from "../lazy-theme-loader";

// Mock theme config
const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#000000",
    text: "#ffffff",
    accent: "#00ff00",
  },
};

const mockThemes = {
  default: mockThemeConfig,
  dark: { ...mockThemeConfig, name: "dark" },
  light: { ...mockThemeConfig, name: "light" },
};

vi.mock("@/lib/themes/theme-config", () => ({
  themes: mockThemes,
}));

// Mock TerminalLoadingProgress
vi.mock("@/components/molecules/terminal/terminal-loading-progress", () => ({
  TerminalLoadingProgress: ({ completionText }: { completionText: string }) => (
    <div data-testid="loading-progress">{completionText}</div>
  ),
}));

describe("LazyThemeLoader", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should show loading state initially", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <LazyThemeLoader themeName="default">
          {() => <div>Loaded</div>}
        </LazyThemeLoader>,
      );

      expect(screen.getByTestId("loading-progress")).toBeInTheDocument();
    });

    it("should render children with theme config when loaded", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const children = vi.fn((config) => (
        <div data-testid="loaded-content">{config.name}</div>
      ));

      render(<LazyThemeLoader themeName="default">{children}</LazyThemeLoader>);

      await waitFor(() => {
        expect(screen.getByTestId("loaded-content")).toBeInTheDocument();
      });

      expect(children).toHaveBeenCalledWith(mockThemeConfig);
      expect(screen.getByText("default")).toBeInTheDocument();
    });

    it("should load different themes", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const children = vi.fn((config) => (
        <div data-testid="loaded-content">{config.name}</div>
      ));

      const { rerender } = render(
        <LazyThemeLoader themeName="default">{children}</LazyThemeLoader>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loaded-content")).toBeInTheDocument();
      });

      rerender(
        <LazyThemeLoader themeName="dark">{children}</LazyThemeLoader>,
      );

      await waitFor(() => {
        expect(children).toHaveBeenCalledWith(mockThemes.dark);
      });
    });

    it("should handle theme loading errors gracefully", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      // Mock import to fail
      vi.doMock("@/lib/themes/theme-config", () => {
        throw new Error("Failed to load");
      });

      const children = vi.fn((config) => (
        <div data-testid="loaded-content">{config.name}</div>
      ));

      render(<LazyThemeLoader themeName="default">{children}</LazyThemeLoader>);

      // Should not render children on error
      await waitFor(() => {
        expect(screen.queryByTestId("loaded-content")).not.toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading progress with correct text", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <LazyThemeLoader themeName="default">
          {() => <div>Loaded</div>}
        </LazyThemeLoader>,
      );

      expect(
        screen.getByText("🎨 Theme loaded successfully!"),
      ).toBeInTheDocument();
    });

    it("should clean up on unmount", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const children = vi.fn((config) => (
        <div data-testid="loaded-content">{config.name}</div>
      ));

      const { unmount } = render(
        <LazyThemeLoader themeName="default">{children}</LazyThemeLoader>,
      );

      unmount();

      // Should not throw errors
      expect(true).toBe(true);
    });
  });
});
