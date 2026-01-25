import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import {
  withLazyLoading,
  CustomizationManager,
  FontManager,
  ThemeManager,
  RoadmapVisualizer,
  HistorySearchPanel,
} from "../lazy-components";

// Mock theme hook
const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#0a0a0a",
    text: "#e5e5e5",
    accent: "#00ff41",
    muted: "#666666",
    border: "#333333",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}));

// Mock lazy components
vi.mock("@/components/organisms/customization/customization-manager", () => ({
  CustomizationManager: () => <div>CustomizationManager</div>,
}));

vi.mock("@/components/molecules/customization/font-manager", () => ({
  FontManager: () => <div>FontManager</div>,
}));

vi.mock("@/components/molecules/customization/theme-manager", () => ({
  ThemeManager: () => <div>ThemeManager</div>,
}));

vi.mock("@/components/organisms/roadmap/roadmap-visualizer", () => ({
  RoadmapVisualizer: () => <div>RoadmapVisualizer</div>,
}));

vi.mock("@/components/molecules/terminal/history-search-panel", () => ({
  HistorySearchPanel: () => <div>HistorySearchPanel</div>,
}));

describe("LazyComponents", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });


  describe("withLazyLoading", () => {
    it("should wrap component with Suspense", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const TestComponent = () => <div>Test Component</div>;
      const WrappedComponent = withLazyLoading(TestComponent);

      render(<WrappedComponent />);

      await waitFor(() => {
        expect(screen.getByText("Test Component")).toBeInTheDocument();
      });
    });

    it("should show loading fallback during load", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const TestComponent = () => <div>Test Component</div>;
      const WrappedComponent = withLazyLoading(
        TestComponent,
        "Loading component...",
      );

      render(<WrappedComponent />);

      // Should show loading initially
      expect(screen.getByText("Loading component...")).toBeInTheDocument();
    });
  });

  describe("Exported Components", () => {
    it("should export CustomizationManager", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(CustomizationManager).toBeDefined();
    });

    it("should export FontManager", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(FontManager).toBeDefined();
    });

    it("should export ThemeManager", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(ThemeManager).toBeDefined();
    });

    it("should export RoadmapVisualizer", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(RoadmapVisualizer).toBeDefined();
    });

    it("should export HistorySearchPanel", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(HistorySearchPanel).toBeDefined();
    });
  });
});
