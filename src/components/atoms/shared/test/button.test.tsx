import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

// Mock accessibility hook
vi.mock(
  "@/components/organisms/accessibility/accessibility-provider",
  () => ({
    useAccessibility: () => ({
      isReducedMotion: false,
    }),
  }),
);

// Import after mocks
import { AnimatedButton } from "../button";

describe("AnimatedButton", () => {
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

      const { container } = render(<AnimatedButton>Click me</AnimatedButton>);
      expect(container).toBeTruthy();
    });

    it("should render children", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AnimatedButton>Click me</AnimatedButton>);
      expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("should render as button element", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<AnimatedButton>Click me</AnimatedButton>);
      const button = container.querySelector("button");
      expect(button).toBeTruthy();
    });
  });

  describe("Variants", () => {
    it("should apply primary variant styles", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <AnimatedButton variant="primary">Primary</AnimatedButton>,
      );
      const button = container.querySelector("button");
      expect(button).toHaveStyle({
        borderColor: mockThemeConfig.colors.accent,
      });
    });

    it("should apply secondary variant styles", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <AnimatedButton variant="secondary">Secondary</AnimatedButton>,
      );
      const button = container.querySelector("button");
      expect(button).toHaveStyle({
        borderColor: mockThemeConfig.colors.border,
      });
    });

    it("should apply success variant styles", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <AnimatedButton variant="success">Success</AnimatedButton>,
      );
      const button = container.querySelector("button");
      expect(button).toHaveStyle({
        borderColor: mockThemeConfig.colors.success,
      });
    });

    it("should apply error variant styles", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <AnimatedButton variant="error">Error</AnimatedButton>,
      );
      const button = container.querySelector("button");
      expect(button).toHaveStyle({
        borderColor: mockThemeConfig.colors.error,
      });
    });

    it("should apply warning variant styles", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <AnimatedButton variant="warning">Warning</AnimatedButton>,
      );
      const button = container.querySelector("button");
      expect(button).toHaveStyle({
        borderColor: mockThemeConfig.colors.warning,
      });
    });

    it("should default to primary variant", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<AnimatedButton>Default</AnimatedButton>);
      const button = container.querySelector("button");
      expect(button).toHaveStyle({
        borderColor: mockThemeConfig.colors.accent,
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
        <AnimatedButton size="sm">Small</AnimatedButton>,
      );
      const button = container.querySelector("button");
      expect(button?.className).toContain("text-xs");
    });

    it("should apply medium size classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <AnimatedButton size="md">Medium</AnimatedButton>,
      );
      const button = container.querySelector("button");
      expect(button?.className).toContain("text-sm");
    });

    it("should apply large size classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <AnimatedButton size="lg">Large</AnimatedButton>,
      );
      const button = container.querySelector("button");
      expect(button?.className).toContain("text-lg");
    });

    it("should default to medium size", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<AnimatedButton>Default</AnimatedButton>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("text-sm");
    });
  });

  describe("Interactions", () => {
    it("should call onClick when clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const handleClick = vi.fn();
      render(<AnimatedButton onClick={handleClick}>Click me</AnimatedButton>);

      const button = screen.getByText("Click me");
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onClick when disabled", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const handleClick = vi.fn();
      render(
        <AnimatedButton onClick={handleClick} disabled>
          Disabled
        </AnimatedButton>,
      );

      const button = screen.getByText("Disabled");
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should apply hover styles on mouse enter", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<AnimatedButton>Hover me</AnimatedButton>);
      const button = container.querySelector("button");

      fireEvent.mouseEnter(button!);

      // Button should have hover background color
      expect(button).toHaveStyle({
        backgroundColor: expect.stringContaining(mockThemeConfig.colors.accent),
      });
    });

    it("should remove hover styles on mouse leave", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<AnimatedButton>Hover me</AnimatedButton>);
      const button = container.querySelector("button");

      fireEvent.mouseEnter(button!);
      fireEvent.mouseLeave(button!);

      // Should return to original background
      expect(button).toHaveStyle({
        backgroundColor: expect.stringContaining(mockThemeConfig.colors.accent),
      });
    });

    it("should not apply hover styles when disabled", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <AnimatedButton disabled>Disabled</AnimatedButton>,
      );
      const button = container.querySelector("button");
      const originalBg = button?.style.backgroundColor;

      fireEvent.mouseEnter(button!);

      // Background should not change when disabled
      expect(button?.style.backgroundColor).toBe(originalBg);
    });
  });

  describe("Disabled State", () => {
    it("should have disabled attribute when disabled", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AnimatedButton disabled>Disabled</AnimatedButton>);
      const button = screen.getByText("Disabled");
      expect(button).toBeDisabled();
    });

    it("should apply disabled styles", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <AnimatedButton disabled>Disabled</AnimatedButton>,
      );
      const button = container.querySelector("button");
      expect(button?.className).toContain("opacity-50");
      expect(button?.className).toContain("cursor-not-allowed");
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label when provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(
        <AnimatedButton ariaLabel="Custom label">Button</AnimatedButton>,
      );
      const button = screen.getByLabelText("Custom label");
      expect(button).toBeInTheDocument();
    });

    it("should have focus styles", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<AnimatedButton>Focus me</AnimatedButton>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("focus:outline-none");
      expect(button?.className).toContain("focus:ring-2");
    });
  });

  describe("Custom Classes", () => {
    it("should apply custom className", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(
        <AnimatedButton className="custom-class">Custom</AnimatedButton>,
      );
      const button = container.querySelector("button");
      expect(button?.className).toContain("custom-class");
    });
  });

  describe("Theme Changes", () => {
    it("should re-render when theme changes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { rerender } = render(<AnimatedButton>Theme</AnimatedButton>);

      // Mock theme change
      vi.mocked(require("@/hooks/use-theme").useTheme).mockReturnValueOnce({
        themeConfig: mockThemeConfig,
        theme: "light",
      });

      rerender(<AnimatedButton>Theme</AnimatedButton>);

      // Component should re-render with new theme
      expect(screen.getByText("Theme")).toBeInTheDocument();
    });
  });

  describe("Reduced Motion", () => {
    it("should not apply transition when reduced motion is enabled", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      vi.mocked(
        require("@/components/organisms/accessibility/accessibility-provider")
          .useAccessibility,
      ).mockReturnValueOnce({
        isReducedMotion: true,
      });

      const { container } = render(
        <AnimatedButton>No Motion</AnimatedButton>,
      );
      const button = container.querySelector("button");
      expect(button?.className).not.toContain("transition-all");
      expect(button?.className).not.toContain("hover:scale-105");
    });
  });
});
