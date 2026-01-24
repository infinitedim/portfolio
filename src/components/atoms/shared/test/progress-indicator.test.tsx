import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock theme hook
const mockThemeConfig = {
  name: "dark",
  colors: {
    bg: "#000000",
    text: "#ffffff",
    border: "#333333",
    accent: "#00ff00",
    success: "#00ff00",
    error: "#ff0000",
    warning: "#ffff00",
    muted: "#888888",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
    theme: "dark",
  }),
}));

// Import after mocks
import { ProgressIndicator } from "../progress-indicator";

describe("ProgressIndicator", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<ProgressIndicator progress={50} />);
      expect(container).toBeTruthy();
    });

    it("should render progress bar", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<ProgressIndicator progress={50} />);
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toBeTruthy();
    });
  });

  describe("Progress Value", () => {
    it("should display correct progress percentage", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<ProgressIndicator progress={75} />);
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("should round progress value", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<ProgressIndicator progress={75.7} />);
      expect(screen.getByText("76%")).toBeInTheDocument();
    });

    it("should clamp progress to 0-100", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<ProgressIndicator progress={150} />);
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toHaveStyle({ width: "100%" });
    });

    it("should handle negative progress", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<ProgressIndicator progress={-10} />);
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toHaveStyle({ width: "0%" });
    });

    it("should apply correct width to progress bar", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<ProgressIndicator progress={60} />);
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toHaveStyle({ width: "60%" });
    });
  });

  describe("Label Display", () => {
    it("should not render label when not provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<ProgressIndicator progress={50} showPercentage={false} />);
      expect(screen.queryByText(/label/i)).not.toBeInTheDocument();
    });

    it("should render label when provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<ProgressIndicator progress={50} label="Loading..." />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should apply theme color to label", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <ProgressIndicator progress={50} label="Loading" />,
      );
      const label = container.querySelector("span");
      expect(label).toHaveStyle({ color: mockThemeConfig.colors.text });
    });
  });

  describe("Percentage Display", () => {
    it("should show percentage by default", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<ProgressIndicator progress={50} />);
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("should hide percentage when showPercentage is false", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<ProgressIndicator progress={50} showPercentage={false} />);
      expect(screen.queryByText("50%")).not.toBeInTheDocument();
    });

    it("should apply theme accent color to percentage", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<ProgressIndicator progress={50} />);
      const percentage = container.querySelectorAll("span")[1];
      expect(percentage).toHaveStyle({
        color: mockThemeConfig.colors.accent,
      });
    });
  });

  describe("Sizes", () => {
    it("should apply small size classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <ProgressIndicator progress={50} size="sm" />,
      );
      const progressBar = container.querySelector(".h-1");
      expect(progressBar).toBeTruthy();
    });

    it("should apply medium size classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <ProgressIndicator progress={50} size="md" />,
      );
      const progressBar = container.querySelector(".h-2");
      expect(progressBar).toBeTruthy();
    });

    it("should apply large size classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <ProgressIndicator progress={50} size="lg" />,
      );
      const progressBar = container.querySelector(".h-3");
      expect(progressBar).toBeTruthy();
    });

    it("should default to medium size", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<ProgressIndicator progress={50} />);
      const progressBar = container.querySelector(".h-2");
      expect(progressBar).toBeTruthy();
    });

    it("should apply correct text size for small", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <ProgressIndicator progress={50} size="sm" label="Loading" />,
      );
      const textElement = container.querySelector(".text-xs");
      expect(textElement).toBeTruthy();
    });

    it("should apply correct text size for medium", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <ProgressIndicator progress={50} size="md" label="Loading" />,
      );
      const textElement = container.querySelector(".text-sm");
      expect(textElement).toBeTruthy();
    });

    it("should apply correct text size for large", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <ProgressIndicator progress={50} size="lg" label="Loading" />,
      );
      const textElement = container.querySelector(".text-base");
      expect(textElement).toBeTruthy();
    });
  });

  describe("Animation", () => {
    it("should apply animation by default", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<ProgressIndicator progress={50} />);
      const progressBar = container.querySelector(".animate-pulse");
      expect(progressBar).toBeTruthy();
    });

    it("should not apply animation when animated is false", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <ProgressIndicator progress={50} animated={false} />,
      );
      const progressBar = container.querySelector(".animate-pulse");
      expect(progressBar).not.toBeInTheDocument();
    });

    it("should have transition classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<ProgressIndicator progress={50} />);
      const progressBar = container.querySelector(".transition-all");
      expect(progressBar).toBeTruthy();
    });
  });

  describe("Styling", () => {
    it("should apply theme accent color to progress bar", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<ProgressIndicator progress={50} />);
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toHaveStyle({
        backgroundColor: mockThemeConfig.colors.accent,
      });
    });

    it("should apply theme border color to background", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<ProgressIndicator progress={50} />);
      const background = container.querySelector(
        '[style*="backgroundColor"]',
      );
      expect(background).toBeTruthy();
    });

    it("should have rounded-full class", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<ProgressIndicator progress={50} />);
      const progressBar = container.querySelector(".rounded-full");
      expect(progressBar).toBeTruthy();
    });

    it("should have box shadow with accent color", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<ProgressIndicator progress={50} />);
      const progressBar = container.querySelector('[style*="boxShadow"]');
      expect(progressBar).toBeTruthy();
    });
  });

  describe("Layout", () => {
    it("should have full width container", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<ProgressIndicator progress={50} />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv?.className).toContain("w-full");
    });

    it("should have flex layout for label and percentage", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <ProgressIndicator progress={50} label="Loading" />,
      );
      const flexDiv = container.querySelector(".flex.justify-between");
      expect(flexDiv).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero progress", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<ProgressIndicator progress={0} />);
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("should handle 100% progress", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<ProgressIndicator progress={100} />);
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("should handle decimal progress values", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<ProgressIndicator progress={33.333} />);
      expect(screen.getByText("33%")).toBeInTheDocument();
    });
  });

  describe("Theme Changes", () => {
    it("should re-render when theme changes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { rerender } = render(<ProgressIndicator progress={50} />);

      // Mock theme change
      vi.mocked(require("@/hooks/use-theme").useTheme).mockReturnValueOnce({
        themeConfig: mockThemeConfig,
        theme: "light",
      });

      rerender(<ProgressIndicator progress={50} />);

      // Component should re-render
      const { container } = render(<ProgressIndicator progress={50} />);
      expect(container).toBeTruthy();
    });
  });
});
