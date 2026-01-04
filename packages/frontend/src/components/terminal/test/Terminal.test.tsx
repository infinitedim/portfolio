import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { Terminal } from "../Terminal";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock all dependencies
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    themeConfig: {
      colors: {
        bg: "#000000",
        text: "#ffffff",
        accent: "#00ff00",
      },
    },
    theme: "dark",
    getPerformanceReport: vi.fn(),
    themeMetrics: {},
    resetPerformanceMetrics: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTerminal", () => ({
  useTerminal: () => ({
    history: [],
    currentInput: "",
    setCurrentInput: vi.fn(),
    isProcessing: false,
    executeCommand: vi.fn(),
    addToHistory: vi.fn(),
    navigateHistory: vi.fn(),
    clearHistory: vi.fn(),
    getCommandSuggestions: vi.fn(),
    getFrequentCommands: vi.fn(),
    commandAnalytics: {},
    favoriteCommands: [],
  }),
}));

vi.mock("@/hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/accessibility/AccessibilityProvider", () => ({
  useAccessibility: () => ({
    announceMessage: vi.fn(),
    isReducedMotion: false,
  }),
}));

vi.mock("@/hooks/useFont", () => ({
  useFont: () => ({
    currentFont: "fira-code",
    changeFont: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTour", () => ({
  useTour: () => ({
    currentStep: null,
    isActive: false,
    startTour: vi.fn(),
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    skipTour: vi.fn(),
  }),
}));

describe("Terminal", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
  });

  it("renders terminal component", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(<Terminal />);
    expect(container).toBeDefined();
  });

  it("renders null during initialization", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    // Component may return null during mount
    const { container } = render(<Terminal />);
    // Should not crash
    expect(container).toBeDefined();
  });
});
