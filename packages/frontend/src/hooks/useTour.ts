"use client";

import {useState, useCallback, useEffect} from "react";
import {
  TOUR_STEPS,
  TOUR_STORAGE_KEY,
  TOUR_VERSION,
  type TourStep,
} from "@/components/onboarding/tourSteps";

interface TourState {
  isActive: boolean;
  currentStepIndex: number;
  hasCompletedTour: boolean;
  isFirstVisit: boolean;
}

interface UseTourReturn {
  /** Whether the tour is currently active */
  isActive: boolean;
  /** Current step being displayed */
  currentStep: TourStep | null;
  /** Current step index (0-based) */
  currentStepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Whether user has completed the tour before */
  hasCompletedTour: boolean;
  /** Whether this is user's first visit */
  isFirstVisit: boolean;
  /** Start the tour */
  startTour: () => void;
  /** Go to next step */
  nextStep: () => void;
  /** Go to previous step */
  prevStep: () => void;
  /** Skip/end the tour */
  skipTour: () => void;
  /** Complete the tour */
  completeTour: () => void;
  /** Go to a specific step */
  goToStep: (index: number) => void;
  /** Reset tour state (for testing or replay) */
  resetTour: () => void;
}

interface StoredTourData {
  completed: boolean;
  version: string;
  completedAt?: string;
}

/**
 * Hook to manage the guided tour state
 * Handles persistence, step navigation, and first-visit detection
 */
export function useTour(): UseTourReturn {
  const [state, setState] = useState<TourState>({
    isActive: false,
    currentStepIndex: 0,
    hasCompletedTour: false,
    isFirstVisit: true,
  });

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(TOUR_STORAGE_KEY);
      if (stored) {
        const data: StoredTourData = JSON.parse(stored);
        // Check if tour version matches (reset if new version)
        if (data.version === TOUR_VERSION && data.completed) {
          setState((prev) => ({
            ...prev,
            hasCompletedTour: true,
            isFirstVisit: false,
          }));
        } else {
          // New version, reset completion status
          setState((prev) => ({
            ...prev,
            hasCompletedTour: false,
            isFirstVisit: false,
          }));
        }
      }
    } catch (error) {
      console.warn("Failed to read tour state from localStorage:", error);
    }
  }, []);

  const saveTourState = useCallback((completed: boolean) => {
    if (typeof window === "undefined") return;

    try {
      const data: StoredTourData = {
        completed,
        version: TOUR_VERSION,
        completedAt: completed ? new Date().toISOString() : undefined,
      };
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save tour state to localStorage:", error);
    }
  }, []);

  const startTour = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: true,
      currentStepIndex: 0,
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentStepIndex + 1;
      if (nextIndex >= TOUR_STEPS.length) {
        // Tour complete
        saveTourState(true);
        return {
          ...prev,
          isActive: false,
          currentStepIndex: 0,
          hasCompletedTour: true,
        };
      }
      return {
        ...prev,
        currentStepIndex: nextIndex,
      };
    });
  }, [saveTourState]);

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStepIndex: Math.max(0, prev.currentStepIndex - 1),
    }));
  }, []);

  const skipTour = useCallback(() => {
    saveTourState(true);
    setState((prev) => ({
      ...prev,
      isActive: false,
      currentStepIndex: 0,
      hasCompletedTour: true,
    }));
  }, [saveTourState]);

  const completeTour = useCallback(() => {
    saveTourState(true);
    setState((prev) => ({
      ...prev,
      isActive: false,
      currentStepIndex: 0,
      hasCompletedTour: true,
    }));
  }, [saveTourState]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < TOUR_STEPS.length) {
      setState((prev) => ({
        ...prev,
        currentStepIndex: index,
      }));
    }
  }, []);

  const resetTour = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOUR_STORAGE_KEY);
    }
    setState({
      isActive: false,
      currentStepIndex: 0,
      hasCompletedTour: false,
      isFirstVisit: true,
    });
  }, []);

  const currentStep = state.isActive
    ? TOUR_STEPS[state.currentStepIndex]
    : null;
  const progress = ((state.currentStepIndex + 1) / TOUR_STEPS.length) * 100;

  return {
    isActive: state.isActive,
    currentStep,
    currentStepIndex: state.currentStepIndex,
    totalSteps: TOUR_STEPS.length,
    progress,
    hasCompletedTour: state.hasCompletedTour,
    isFirstVisit: state.isFirstVisit,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    goToStep,
    resetTour,
  };
}
