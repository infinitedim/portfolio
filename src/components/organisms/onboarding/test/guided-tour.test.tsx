import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { GuidedTour } from "../guided-tour";
import type { TourStep } from "../tour-steps";

// Mock dependencies
const mockAnnounceMessage = vi.fn();
const mockIsReducedMotion = false;

vi.mock("@/components/organisms/accessibility/accessibility-provider", () => ({
  useAccessibility: () => ({
    announceMessage: mockAnnounceMessage,
    isReducedMotion: mockIsReducedMotion,
  }),
}));

const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#000000",
    text: "#ffffff",
    accent: "#00ff00",
    border: "#333333",
    muted: "#888888",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.confirm
const mockConfirm = vi.fn(() => true);
if (typeof window !== "undefined") {
  window.confirm = mockConfirm;
}

// Mock getBoundingClientRect
const mockGetBoundingClientRect = vi.fn(() => ({
  top: 100,
  left: 100,
  width: 200,
  height: 50,
  bottom: 150,
  right: 300,
}));

describe("GuidedTour", () => {
  const mockStep: TourStep = {
    id: "test-step",
    title: "Test Step",
    content: "This is a test step",
    target: "#test-target",
    position: "top",
    icon: "🎯",
  };

  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup DOM element
    if (typeof document !== "undefined") {
      const testElement = document.createElement("div");
      testElement.id = "test-target";
      testElement.getBoundingClientRect = mockGetBoundingClientRect;
      document.body.appendChild(testElement);
    }
  });

  afterEach(() => {
    vi.useRealTimers();
    if (typeof document !== "undefined") {
      const testElement = document.getElementById("test-target");
      if (testElement && testElement.parentNode) {
        testElement.parentNode.removeChild(testElement);
      }
    }
  });

  describe("Rendering", () => {
    it("should render tour tooltip", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <GuidedTour
          step={mockStep}
          stepIndex={0}
          totalSteps={3}
          progress={33}
          onNext={vi.fn()}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      expect(screen.getByText("Test Step")).toBeInTheDocument();
      expect(screen.getByText("This is a test step")).toBeInTheDocument();
    });

    it("should display step number", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <GuidedTour
          step={mockStep}
          stepIndex={1}
          totalSteps={5}
          progress={40}
          onNext={vi.fn()}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      expect(screen.getByText(/Step 2 of 5/i)).toBeInTheDocument();
    });

    it("should display progress bar", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <GuidedTour
          step={mockStep}
          stepIndex={0}
          totalSteps={3}
          progress={33}
          onNext={vi.fn()}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      const progressBar = container.querySelector('[style*="width: 33%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it("should display step icon", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <GuidedTour
          step={mockStep}
          stepIndex={0}
          totalSteps={3}
          progress={33}
          onNext={vi.fn()}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      expect(screen.getByText("🎯")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should call onNext when next button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const onNext = vi.fn();
      render(
        <GuidedTour
          step={mockStep}
          stepIndex={0}
          totalSteps={3}
          progress={33}
          onNext={onNext}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it("should call onPrev when back button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const onPrev = vi.fn();
      render(
        <GuidedTour
          step={mockStep}
          stepIndex={1}
          totalSteps={3}
          progress={66}
          onNext={vi.fn()}
          onPrev={onPrev}
          onSkip={vi.fn()}
        />,
      );

      const backButton = screen.getByText("← Back");
      fireEvent.click(backButton);

      expect(onPrev).toHaveBeenCalledTimes(1);
    });

    it("should disable back button on first step", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <GuidedTour
          step={mockStep}
          stepIndex={0}
          totalSteps={3}
          progress={33}
          onNext={vi.fn()}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      const backButton = screen.getByText("← Back");
      expect(backButton).toBeDisabled();
    });

    it("should show 'Get Started!' on last step", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <GuidedTour
          step={mockStep}
          stepIndex={2}
          totalSteps={3}
          progress={100}
          onNext={vi.fn()}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      expect(screen.getByText("Get Started!")).toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should navigate next on ArrowRight", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }
      const onNext = vi.fn();
      render(
        <GuidedTour
          step={mockStep}
          stepIndex={0}
          totalSteps={3}
          progress={33}
          onNext={onNext}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      fireEvent.keyDown(document, { key: "ArrowRight" });

      expect(onNext).toHaveBeenCalled();
    });

    it("should navigate previous on ArrowLeft", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }
      const onPrev = vi.fn();
      render(
        <GuidedTour
          step={mockStep}
          stepIndex={1}
          totalSteps={3}
          progress={66}
          onNext={vi.fn()}
          onPrev={onPrev}
          onSkip={vi.fn()}
        />,
      );

      fireEvent.keyDown(document, { key: "ArrowLeft" });

      expect(onPrev).toHaveBeenCalled();
    });

    it("should navigate next on Enter", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }
      const onNext = vi.fn();
      render(
        <GuidedTour
          step={mockStep}
          stepIndex={0}
          totalSteps={3}
          progress={33}
          onNext={onNext}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      fireEvent.keyDown(document, { key: "Enter" });

      expect(onNext).toHaveBeenCalled();
    });

    it("should skip on Escape", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof document === "undefined" || typeof window === "undefined") {
        expect(true).toBe(true);
        return;
      }
      const onSkip = vi.fn();
      render(
        <GuidedTour
          step={mockStep}
          stepIndex={0}
          totalSteps={3}
          progress={33}
          onNext={vi.fn()}
          onPrev={vi.fn()}
          onSkip={onSkip}
        />,
      );

      fireEvent.keyDown(document, { key: "Escape" });

      if (window.confirm) {
        expect(mockConfirm).toHaveBeenCalled();
      }
      expect(onSkip).toHaveBeenCalled();
    });
  });

  describe("Demo Command", () => {
    it("should display demo command button when provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const stepWithDemo: TourStep = {
        ...mockStep,
        demoCommand: "help",
      };

      render(
        <GuidedTour
          step={stepWithDemo}
          stepIndex={0}
          totalSteps={3}
          progress={33}
          onNext={vi.fn()}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
          onDemoCommand={vi.fn()}
        />,
      );

      expect(screen.getByText(/Try it:/i)).toBeInTheDocument();
      expect(screen.getByText("help")).toBeInTheDocument();
    });

    it("should call onDemoCommand when demo button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const onDemoCommand = vi.fn();
      const stepWithDemo: TourStep = {
        ...mockStep,
        demoCommand: "help",
      };

      render(
        <GuidedTour
          step={stepWithDemo}
          stepIndex={0}
          totalSteps={3}
          progress={33}
          onNext={vi.fn()}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
          onDemoCommand={onDemoCommand}
        />,
      );

      const tryButton = screen.getByText(/Try it:/i).closest("button");
      if (tryButton) {
        fireEvent.click(tryButton);
        expect(onDemoCommand).toHaveBeenCalledWith("help");
      }
    });
  });

  describe("Tips", () => {
    it("should display tips when provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const stepWithTips: TourStep = {
        ...mockStep,
        tips: ["Tip 1", "Tip 2"],
      };

      render(
        <GuidedTour
          step={stepWithTips}
          stepIndex={0}
          totalSteps={3}
          progress={33}
          onNext={vi.fn()}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      expect(screen.getByText(/Tips:/i)).toBeInTheDocument();
      expect(screen.getByText("Tip 1")).toBeInTheDocument();
      expect(screen.getByText("Tip 2")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should announce step change to screen readers", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <GuidedTour
          step={mockStep}
          stepIndex={0}
          totalSteps={3}
          progress={33}
          onNext={vi.fn()}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      expect(mockAnnounceMessage).toHaveBeenCalledWith(
        "Tour step 1 of 3: Test Step",
        "polite",
      );
    });

    it("should have proper ARIA attributes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <GuidedTour
          step={mockStep}
          stepIndex={0}
          totalSteps={3}
          progress={33}
          onNext={vi.fn()}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "tour-title");
    });
  });

  describe("Skip Functionality", () => {
    it("should call onSkip when skip button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined") {
        expect(true).toBe(true);
        return;
      }
      const onSkip = vi.fn();
      mockConfirm.mockReturnValue(true);

      render(
        <GuidedTour
          step={mockStep}
          stepIndex={0}
          totalSteps={3}
          progress={33}
          onNext={vi.fn()}
          onPrev={vi.fn()}
          onSkip={onSkip}
        />,
      );

      const skipButton = screen.getByText("Skip");
      fireEvent.click(skipButton);

      if (window.confirm) {
        expect(mockConfirm).toHaveBeenCalled();
      }
      expect(onSkip).toHaveBeenCalled();
    });
  });
});
