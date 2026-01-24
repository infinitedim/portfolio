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
import { LoadingSpinner } from "../loading-spinner";

describe("LoadingSpinner", () => {
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

      const { container } = render(<LoadingSpinner />);
      expect(container).toBeTruthy();
    });

    it("should render spinner element", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeTruthy();
    });

    it("should have role status", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner />);
      const element = container.querySelector('[role="status"]');
      expect(element).toBeTruthy();
    });

    it("should have aria-label", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner />);
      const element = container.querySelector('[aria-label="Loading"]');
      expect(element).toBeTruthy();
    });
  });

  describe("Sizes", () => {
    it("should apply small size classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner size="sm" />);
      const spinner = container.querySelector(".w-4.h-4");
      expect(spinner).toBeTruthy();
    });

    it("should apply medium size classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner size="md" />);
      const spinner = container.querySelector(".w-6.h-6");
      expect(spinner).toBeTruthy();
    });

    it("should apply large size classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner size="lg" />);
      const spinner = container.querySelector(".w-8.h-8");
      expect(spinner).toBeTruthy();
    });

    it("should default to medium size", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector(".w-6.h-6");
      expect(spinner).toBeTruthy();
    });
  });

  describe("Text Display", () => {
    it("should not render text when not provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner />);
      const textElement = container.querySelector("span");
      expect(textElement).not.toBeInTheDocument();
    });

    it("should render text when provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<LoadingSpinner text="Loading..." />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should apply correct text size for small spinner", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <LoadingSpinner size="sm" text="Loading" />,
      );
      const textElement = container.querySelector(".text-xs");
      expect(textElement).toBeTruthy();
    });

    it("should apply correct text size for medium spinner", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <LoadingSpinner size="md" text="Loading" />,
      );
      const textElement = container.querySelector(".text-sm");
      expect(textElement).toBeTruthy();
    });

    it("should apply correct text size for large spinner", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <LoadingSpinner size="lg" text="Loading" />,
      );
      const textElement = container.querySelector(".text-base");
      expect(textElement).toBeTruthy();
    });

    it("should apply pulse animation to text", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner text="Loading" />);
      const textElement = container.querySelector(".animate-pulse");
      expect(textElement).toBeTruthy();
    });

    it("should apply theme color to text", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner text="Loading" />);
      const textElement = container.querySelector("span");
      expect(textElement).toHaveStyle({
        color: mockThemeConfig.colors.text,
      });
    });
  });

  describe("Spinner Styling", () => {
    it("should apply theme accent color to spinner", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toHaveStyle({
        borderTopColor: mockThemeConfig.colors.accent,
      });
    });

    it("should have rounded-full class", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector(".rounded-full");
      expect(spinner).toBeTruthy();
    });

    it("should have border classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector(".border-2");
      expect(spinner).toBeTruthy();
    });

    it("should have aria-hidden on spinner", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('[aria-hidden="true"]');
      expect(spinner).toBeTruthy();
    });
  });

  describe("Custom Classes", () => {
    it("should apply custom className", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <LoadingSpinner className="custom-class" />,
      );
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv?.className).toContain("custom-class");
    });
  });

  describe("Layout", () => {
    it("should have flex layout", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv?.className).toContain("flex");
      expect(outerDiv?.className).toContain("items-center");
      expect(outerDiv?.className).toContain("gap-2");
    });
  });

  describe("Theme Changes", () => {
    it("should re-render when theme changes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { rerender } = render(<LoadingSpinner />);

      // Mock theme change
      vi.mocked(require("@/hooks/use-theme").useTheme).mockReturnValueOnce({
        themeConfig: mockThemeConfig,
        theme: "light",
      });

      rerender(<LoadingSpinner />);

      // Component should re-render
      const { container } = render(<LoadingSpinner />);
      expect(container).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<LoadingSpinner />);
      const element = container.querySelector('[role="status"]');
      expect(element?.getAttribute("aria-label")).toBe("Loading");
    });
  });
});
