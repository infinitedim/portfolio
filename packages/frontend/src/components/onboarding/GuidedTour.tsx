"use client";

import { useEffect, useCallback, JSX, memo } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";
import type { TourStep } from "./tourSteps";

interface GuidedTourProps {
  /** Current tour step to display */
  step: TourStep;
  /** Current step index (0-based) */
  stepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Callback to go to next step */
  onNext: () => void;
  /** Callback to go to previous step */
  onPrev: () => void;
  /** Callback to skip/close the tour */
  onSkip: () => void;
  /** Optional callback when a demo command should be executed */
  onDemoCommand?: (command: string) => void;
}

/**
 * Guided tour overlay component
 * Displays step-by-step walkthrough with highlighting and tooltips
 */
export const GuidedTour = memo(function GuidedTour({
  step,
  stepIndex,
  totalSteps,
  progress,
  onNext,
  onPrev,
  onSkip,
  onDemoCommand,
}: GuidedTourProps): JSX.Element {
  const { themeConfig } = useTheme();
  const { announceMessage, isReducedMotion } = useAccessibility();

  // Announce step change to screen readers
  useEffect(() => {
    announceMessage(`Tour step ${stepIndex + 1} of ${totalSteps}: ${step.title}`, "polite");
  }, [stepIndex, totalSteps, step.title, announceMessage]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onSkip();
          break;
        case "ArrowRight":
        case "Enter":
          e.preventDefault();
          onNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (stepIndex > 0) onPrev();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrev, onSkip, stepIndex]);

  // Highlight target element if specified
  useEffect(() => {
    if (!step.target) return;

    const targetElement = document.querySelector(step.target);
    if (targetElement) {
      targetElement.classList.add("tour-highlight");
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return () => {
      if (targetElement) {
        targetElement.classList.remove("tour-highlight");
      }
    };
  }, [step.target]);

  const handleTryCommand = useCallback(() => {
    if (step.demoCommand && onDemoCommand) {
      onDemoCommand(step.demoCommand);
    }
  }, [step.demoCommand, onDemoCommand]);

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;

  // Position styles based on step configuration
  const getPositionStyles = (): React.CSSProperties => {
    if (step.position === "center") {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    // For targeted positioning, calculate based on target element
    if (step.target) {
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const padding = 20;

        switch (step.position) {
          case "top":
            return {
              position: "fixed",
              bottom: `${window.innerHeight - rect.top + padding}px`,
              left: `${rect.left + rect.width / 2}px`,
              transform: "translateX(-50%)",
            };
          case "bottom":
            return {
              position: "fixed",
              top: `${rect.bottom + padding}px`,
              left: `${rect.left + rect.width / 2}px`,
              transform: "translateX(-50%)",
            };
          case "left":
            return {
              position: "fixed",
              top: `${rect.top + rect.height / 2}px`,
              right: `${window.innerWidth - rect.left + padding}px`,
              transform: "translateY(-50%)",
            };
          case "right":
            return {
              position: "fixed",
              top: `${rect.top + rect.height / 2}px`,
              left: `${rect.right + padding}px`,
              transform: "translateY(-50%)",
            };
        }
      }
    }

    // Default to center
    return {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-9998 pointer-events-auto"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(2px)",
        }}
        onClick={onSkip}
        aria-hidden="true"
      />

      {/* Tour step card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-content"
        className={`z-9999 w-[90vw] max-w-md rounded-lg border shadow-2xl ${!isReducedMotion ? "animate-in fade-in-0 zoom-in-95 duration-300" : ""
          }`}
        style={{
          ...getPositionStyles(),
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.accent,
          boxShadow: `0 0 40px ${themeConfig.colors.accent}40, 0 20px 60px rgba(0, 0, 0, 0.5)`,
        }}
      >
        {/* Progress bar */}
        <div
          className="h-1 rounded-t-lg transition-all duration-300"
          style={{ backgroundColor: `${themeConfig.colors.muted}30` }}
        >
          <div
            className="h-full rounded-t-lg transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: themeConfig.colors.accent,
            }}
          />
        </div>

        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: themeConfig.colors.border }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{step.icon}</span>
              <h2
                id="tour-title"
                className="text-lg font-bold"
                style={{ color: themeConfig.colors.accent }}
              >
                {step.title}
              </h2>
            </div>
            <button
              onClick={onSkip}
              className="p-1 rounded hover:opacity-70 transition-opacity"
              style={{ color: themeConfig.colors.muted }}
              aria-label="Close tour"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div
            className="text-xs mt-1"
            style={{ color: themeConfig.colors.muted }}
          >
            Step {stepIndex + 1} of {totalSteps}
          </div>
        </div>

        {/* Content */}
        <div className="p-4" id="tour-content">
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: themeConfig.colors.text }}
          >
            {step.content}
          </p>

          {/* Tips section */}
          {step.tips && step.tips.length > 0 && (
            <div
              className="rounded-lg p-3 mb-4"
              style={{
                backgroundColor: `${themeConfig.colors.accent}10`,
                borderLeft: `3px solid ${themeConfig.colors.accent}`,
              }}
            >
              <div
                className="text-xs font-semibold mb-2"
                style={{ color: themeConfig.colors.accent }}
              >
                💡 Tips:
              </div>
              <ul className="space-y-1">
                {step.tips.map((tip, index) => (
                  <li
                    key={index}
                    className="text-xs flex items-start gap-2"
                    style={{ color: themeConfig.colors.text }}
                  >
                    <span style={{ color: themeConfig.colors.accent }}>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Demo command button */}
          {step.demoCommand && onDemoCommand && (
            <button
              onClick={handleTryCommand}
              className="w-full py-2 px-3 rounded-lg border text-sm font-mono transition-all hover:scale-[1.02] mb-4"
              style={{
                backgroundColor: `${themeConfig.colors.accent}15`,
                borderColor: themeConfig.colors.accent,
                color: themeConfig.colors.accent,
              }}
            >
              ⚡ Try it: <code className="font-bold">{step.demoCommand}</code>
            </button>
          )}
        </div>

        {/* Footer navigation */}
        <div
          className="p-4 border-t flex items-center justify-between"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <button
            onClick={onPrev}
            disabled={isFirstStep}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isFirstStep ? "opacity-40 cursor-not-allowed" : "hover:opacity-80"
              }`}
            style={{
              color: themeConfig.colors.muted,
              backgroundColor: `${themeConfig.colors.muted}15`,
            }}
          >
            ← Back
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onSkip}
              className="px-3 py-2 text-xs hover:opacity-70 transition-opacity"
              style={{ color: themeConfig.colors.muted }}
            >
              Skip tour
            </button>
            <button
              onClick={onNext}
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
              style={{
                backgroundColor: themeConfig.colors.accent,
                color: themeConfig.colors.bg,
              }}
            >
              {isLastStep ? "Get Started! 🚀" : "Next →"}
            </button>
          </div>
        </div>

        {/* Keyboard hints */}
        <div
          className="px-4 pb-3 flex items-center justify-center gap-4 text-[10px]"
          style={{ color: themeConfig.colors.muted }}
        >
          <span>← → Navigate</span>
          <span>Enter Next</span>
          <span>ESC Skip</span>
        </div>
      </div>

      {/* Global highlight styles */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 9997 !important;
          box-shadow: 0 0 0 4px ${themeConfig.colors.accent},
            0 0 20px ${themeConfig.colors.accent}60 !important;
          border-radius: 8px !important;
          animation: ${isReducedMotion ? "none" : "tour-pulse 2s infinite"};
        }

        @keyframes tour-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 4px ${themeConfig.colors.accent},
              0 0 20px ${themeConfig.colors.accent}60;
          }
          50% {
            box-shadow: 0 0 0 6px ${themeConfig.colors.accent},
              0 0 30px ${themeConfig.colors.accent}80;
          }
        }
      `}</style>
    </>
  );
});
