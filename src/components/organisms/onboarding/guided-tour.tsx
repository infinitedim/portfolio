"use client";

import { useEffect, useCallback, useState, useRef, JSX, memo } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";
import type { TourStep } from "@/components/organisms/onboarding/tour-steps";

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

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Guided tour overlay component with spotlight effect
 * Displays step-by-step walkthrough with highlighting and tooltips
 * Improved UX: tour continues even after demo commands
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
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [showTooltip, setShowTooltip] = useState(true);
  const [tooltipHeight, setTooltipHeight] = useState(400);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Announce step change to screen readers
  useEffect(() => {
    announceMessage(`Tour step ${stepIndex + 1} of ${totalSteps}: ${step.title}`, "polite");
  }, [stepIndex, totalSteps, step.title, announceMessage]);

  // Update tooltip height when it changes
  useEffect(() => {
    if (!tooltipRef.current) return;

    const updateHeight = () => {
      if (tooltipRef.current) {
        setTooltipHeight(tooltipRef.current.offsetHeight);
      }
    };

    // Initial measurement
    updateHeight();

    // Use ResizeObserver for accurate height tracking
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(tooltipRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [stepIndex, showTooltip]);

  // Handle keyboard navigation - only when tour is active and input is not focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        (activeElement instanceof HTMLElement && activeElement.isContentEditable)
      );

      // Only handle tour navigation if input is not focused
      // Exception: ESC should always work to skip tour
      if (isInputFocused && e.key !== "Escape") {
        return;
      }

      switch (e.key) {
        case "Escape":
          // Don't allow ESC to skip easily - show confirmation
          if (window.confirm("Are you sure you want to skip the tour?")) {
            e.preventDefault();
            e.stopPropagation();
            onSkip();
          }
          break;
        case "ArrowRight":
          // Only handle if not in input and not with modifier keys
          if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            onNext();
          }
          break;
        case "Enter":
          // Only handle Enter if not in input
          if (!isInputFocused) {
            e.preventDefault();
            e.stopPropagation();
            onNext();
          }
          break;
        case "ArrowLeft":
          // Only handle if not in input and not with modifier keys
          if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            if (stepIndex > 0) onPrev();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown, true); // Use capture phase
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onNext, onPrev, onSkip, stepIndex]);

  // Calculate highlight position for target element
  useEffect(() => {
    if (!step.target) {
      setHighlightRect(null);
      return;
    }

    let hasScrolled = false; // Track if we've already scrolled for this step

    const updateHighlight = (shouldScroll = false) => {
      const targetElement = document.querySelector(step.target!);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const padding = 8; // Padding around highlighted element

        setHighlightRect({
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });

        // Only scroll into view once when step changes, not on every update
        if (shouldScroll && !hasScrolled) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
          hasScrolled = true;
        }

        // Add highlight class
        targetElement.classList.add("tour-highlight-active");
      } else {
        setHighlightRect(null);
      }
    };

    // Initial update with scroll
    updateHighlight(true);

    // Update on resize/scroll without scrolling
    const handleResize = () => updateHighlight(false);
    const handleScroll = () => updateHighlight(false);

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      const targetElement = document.querySelector(step.target!);
      if (targetElement) {
        targetElement.classList.remove("tour-highlight-active");
      }
      hasScrolled = false; // Reset for next step
    };
  }, [step.target]);

  const handleTryCommand = useCallback(() => {
    if (step.demoCommand && onDemoCommand) {
      // Execute command but DON'T close the tour
      onDemoCommand(step.demoCommand);
      // Show feedback that command was executed
      setShowTooltip(false);
      setTimeout(() => {
        setShowTooltip(true);
      }, 500);
    }
  }, [step.demoCommand, onDemoCommand]);

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;

  // Calculate tooltip position based on step configuration
  const getTooltipPosition = (): React.CSSProperties => {
    if (!highlightRect) {
      // Center position for steps without target - ensure it's above overlay
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10001, // Higher than overlay
        maxWidth: "500px",
      };
    }

    const padding = 20;
    const tooltipWidth = 380;
    // Use state-based tooltipHeight for accurate positioning
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    switch (step.position) {
      case "top": {
        // Position above the target
        const spaceAbove = highlightRect.top;
        const spaceBelow = viewportHeight - highlightRect.top - highlightRect.height;

        // If not enough space above, position below instead
        if (spaceAbove < tooltipHeight + padding && spaceBelow > tooltipHeight + padding) {
          return {
            position: "fixed",
            top: `${Math.min(highlightRect.top + highlightRect.height + padding, viewportHeight - tooltipHeight - padding)}px`,
            left: `${Math.max(padding, Math.min(highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2, viewportWidth - tooltipWidth - padding))}px`,
            zIndex: 10001,
            maxHeight: `${viewportHeight - padding * 2}px`,
            overflowY: "auto",
          };
        }

        // Position above, but ensure it doesn't go off-screen
        // If space is limited, use available space and make it scrollable
        const availableSpace = Math.max(padding * 2, highlightRect.top - padding);
        const topPosition = Math.max(padding, highlightRect.top - Math.min(tooltipHeight, availableSpace) - padding);
        return {
          position: "fixed",
          top: `${topPosition}px`,
          left: `${Math.max(padding, Math.min(highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2, viewportWidth - tooltipWidth - padding))}px`,
          zIndex: 10001,
          maxHeight: `${Math.min(tooltipHeight, availableSpace)}px`,
          overflowY: "auto",
        };
      }
      case "bottom":
        return {
          position: "fixed",
          top: `${Math.min(highlightRect.top + highlightRect.height + padding, viewportHeight - tooltipHeight - padding)}px`,
          left: `${Math.max(padding, Math.min(highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2, viewportWidth - tooltipWidth - padding))}px`,
          zIndex: 10001,
          maxHeight: `${viewportHeight - (highlightRect.top + highlightRect.height + padding) - padding}px`,
          overflowY: "auto",
        };
      case "left":
        return {
          position: "fixed",
          top: `${Math.max(padding, Math.min(highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2, viewportHeight - tooltipHeight - padding))}px`,
          right: `${Math.max(padding, viewportWidth - highlightRect.left + padding)}px`,
          zIndex: 10001,
          maxWidth: `${Math.min(380, highlightRect.left - padding * 2)}px`,
          maxHeight: `${viewportHeight - padding * 2}px`,
          overflowY: "auto",
        };
      case "right":
        return {
          position: "fixed",
          top: `${Math.max(padding, Math.min(highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2, viewportHeight - tooltipHeight - padding))}px`,
          left: `${Math.min(highlightRect.left + highlightRect.width + padding, viewportWidth - tooltipWidth - padding)}px`,
          zIndex: 10001,
          maxWidth: `${Math.min(380, viewportWidth - highlightRect.left - highlightRect.width - padding * 2)}px`,
          maxHeight: `${viewportHeight - padding * 2}px`,
          overflowY: "auto",
        };
      default:
        return {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10001,
          maxHeight: `${viewportHeight - padding * 2}px`,
          overflowY: "auto",
        };
    }
  };

  return (
    <>
      {/* Spotlight overlay with hole for highlighted element */}
      <div
        className="fixed inset-0 z-9998 pointer-events-auto"
        onClick={(e) => {
          // Prevent backdrop click from closing tour
          e.stopPropagation();
        }}
        aria-hidden="true"
        style={{ pointerEvents: "auto" }}
      >
        {/* Dark overlay - top section */}
        {highlightRect && highlightRect.top > 0 && (
          <div
            className="fixed left-0 right-0 pointer-events-none"
            style={{
              top: 0,
              height: `${highlightRect.top}px`,
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              backdropFilter: "blur(4px)",
              zIndex: 9998,
            }}
          />
        )}

        {/* Dark overlay - bottom section */}
        {highlightRect && (
          <div
            className="fixed left-0 right-0 pointer-events-none"
            style={{
              top: `${highlightRect.top + highlightRect.height}px`,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              backdropFilter: "blur(4px)",
              zIndex: 9998,
            }}
          />
        )}

        {/* Dark overlay - left section */}
        {highlightRect && (
          <div
            className="fixed pointer-events-none"
            style={{
              top: `${highlightRect.top}px`,
              left: 0,
              width: `${highlightRect.left}px`,
              height: `${highlightRect.height}px`,
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              backdropFilter: "blur(4px)",
              zIndex: 9998,
            }}
          />
        )}

        {/* Dark overlay - right section */}
        {highlightRect && (
          <div
            className="fixed pointer-events-none"
            style={{
              top: `${highlightRect.top}px`,
              left: `${highlightRect.left + highlightRect.width}px`,
              right: 0,
              height: `${highlightRect.height}px`,
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              backdropFilter: "blur(4px)",
              zIndex: 9998,
            }}
          />
        )}

        {/* Full overlay for steps without target - lighter for center steps */}
        {!highlightRect && (
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(1px)",
              zIndex: 9998,
            }}
          />
        )}
      </div>

      {/* Highlight border around target element */}
      {highlightRect && (
        <>
          {/* Outer glow ring */}
          <div
            className="fixed pointer-events-none z-9999"
            style={{
              top: `${highlightRect.top - 6}px`,
              left: `${highlightRect.left - 6}px`,
              width: `${highlightRect.width + 12}px`,
              height: `${highlightRect.height + 12}px`,
              borderRadius: "12px",
              boxShadow: `0 0 0 2px ${themeConfig.colors.accent}40, 0 0 50px ${themeConfig.colors.accent}50`,
              animation: isReducedMotion ? "none" : "tour-pulse-outer 2s ease-in-out infinite",
            }}
          />
          {/* Inner border */}
          <div
            className="fixed pointer-events-none z-9999"
            style={{
              top: `${highlightRect.top}px`,
              left: `${highlightRect.left}px`,
              width: `${highlightRect.width}px`,
              height: `${highlightRect.height}px`,
              border: `3px solid ${themeConfig.colors.accent}`,
              borderRadius: "8px",
              boxShadow: `inset 0 0 20px ${themeConfig.colors.accent}30, 0 0 30px ${themeConfig.colors.accent}60`,
            }}
          />
        </>
      )}

      {/* Tour tooltip card */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-title"
          aria-describedby="tour-content"
          className={`z-10001 w-[90vw] max-w-md rounded-xl border-2 shadow-2xl pointer-events-auto overflow-hidden ${!isReducedMotion ? "animate-in fade-in-0 zoom-in-95 duration-300" : ""
            }`}
          style={{
            ...getTooltipPosition(),
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.accent,
            borderWidth: "2px",
            boxShadow: `0 0 0 2px ${themeConfig.colors.accent}60, 0 25px 80px rgba(0, 0, 0, 0.9), 0 0 60px ${themeConfig.colors.accent}40`,
          }}
        >
          {/* Progress bar */}
          <div
            className="h-1.5 rounded-t-xl transition-all duration-500"
            style={{ backgroundColor: `${themeConfig.colors.muted}20` }}
          >
            <div
              className="h-full rounded-t-xl transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: themeConfig.colors.accent,
                boxShadow: `0 0 10px ${themeConfig.colors.accent}60`,
              }}
            />
          </div>

          {/* Header */}
          <div className="p-5 border-b" style={{ borderColor: themeConfig.colors.border }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{step.icon}</span>
                <div>
                  <h2
                    id="tour-title"
                    className="text-xl font-bold"
                    style={{ color: themeConfig.colors.accent }}
                  >
                    {step.title}
                  </h2>
                  <div
                    className="text-xs mt-1"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    Step {stepIndex + 1} of {totalSteps}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content - scrollable if needed */}
          <div
            className="p-5 overflow-y-auto"
            id="tour-content"
            style={{
              maxHeight: `min(calc(100vh - 300px), ${Math.max(200, window.innerHeight * 0.6)}px)`,
            }}
          >
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
                  {step.tips?.map((tip: string, index: number) => (
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
                className="w-full py-3 px-4 rounded-lg border text-sm font-mono transition-all hover:scale-[1.02] active:scale-[0.98] mb-4 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: `${themeConfig.colors.accent}15`,
                  borderColor: themeConfig.colors.accent,
                  color: themeConfig.colors.accent,
                }}
              >
                <span>⚡</span>
                <span>Try it:</span>
                <code className="font-bold bg-black/20 px-2 py-1 rounded">{step.demoCommand}</code>
                <span className="text-xs opacity-70">(Tour continues)</span>
              </button>
            )}
          </div>

          {/* Footer navigation */}
          <div
            className="p-5 border-t flex items-center justify-between gap-3"
            style={{ borderColor: themeConfig.colors.border }}
          >
            <button
              onClick={onPrev}
              disabled={isFirstStep}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isFirstStep ? "opacity-40 cursor-not-allowed" : "hover:opacity-80 hover:scale-105"
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
                onClick={() => {
                  if (window.confirm("Are you sure you want to skip the tour?")) {
                    onSkip();
                  }
                }}
                className="px-3 py-2 text-xs hover:opacity-70 transition-opacity"
                style={{ color: themeConfig.colors.muted }}
              >
                Skip
              </button>
              <button
                onClick={onNext}
                className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                style={{
                  backgroundColor: themeConfig.colors.accent,
                  color: themeConfig.colors.bg,
                  boxShadow: `0 4px 12px ${themeConfig.colors.accent}40`,
                }}
              >
                {isLastStep ? (
                  <>
                    <span>Get Started!</span>
                    <span>🚀</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Keyboard hints */}
          <div
            className="px-5 pb-4 flex items-center justify-center gap-4 text-[10px] flex-wrap"
            style={{ color: themeConfig.colors.muted }}
          >
            <span>← → Navigate</span>
            <span>Enter Next</span>
            <span>ESC Skip</span>
          </div>
        </div>
      )}

      {/* Global highlight styles */}
      <style jsx global>{`
        .tour-highlight-active {
          position: relative;
          z-index: 9999 !important;
          transition: all 0.3s ease;
        }

        @keyframes tour-pulse-outer {
          0%,
          100% {
            box-shadow: 0 0 0 2px ${themeConfig.colors.accent}40,
              0 0 40px ${themeConfig.colors.accent}40,
              0 0 80px ${themeConfig.colors.accent}20;
          }
          50% {
            box-shadow: 0 0 0 3px ${themeConfig.colors.accent}60,
              0 0 60px ${themeConfig.colors.accent}60,
              0 0 120px ${themeConfig.colors.accent}40;
          }
        }
      `}</style>
    </>
  );
});
