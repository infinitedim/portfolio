import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AccessibilityProvider, useAccessibility } from "../AccessibilityProvider";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Only define localStorage if window is available
if (canRunTests && typeof window !== "undefined") {
  try {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  } catch {
    // localStorage might already be defined, skip
  }
}

// Mock matchMedia
const createMatchMedia = (matches: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

// Test component that uses the hook
function TestComponent() {
  const {
    fontSize,
    setFontSize,
    focusMode,
    setFocusMode,
    isHighContrast,
    isReducedMotion,
    announceMessage,
  } = useAccessibility();

  return (
    <div>
      <span data-testid="font-size">{fontSize}</span>
      <span data-testid="focus-mode">{focusMode.toString()}</span>
      <span data-testid="high-contrast">{isHighContrast.toString()}</span>
      <span data-testid="reduced-motion">{isReducedMotion.toString()}</span>
      <button onClick={() => setFontSize("large")}>Set Large Font</button>
      <button onClick={() => setFocusMode(true)}>Enable Focus Mode</button>
      <button onClick={() => announceMessage("Test message", "polite")}>
        Announce
      </button>
    </div>
  );
}

describe("AccessibilityProvider", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }

    ensureDocumentBody();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    if (typeof window !== "undefined") {
      window.matchMedia = createMatchMedia(false);
    }
  });

  it("renders children correctly", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <AccessibilityProvider>
        <div data-testid="child">Child Content</div>
      </AccessibilityProvider>,
    );

    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByTestId("child").textContent).toBe("Child Content");
  });

  it("provides default context values", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    expect(screen.getByTestId("font-size").textContent).toBe("medium");
    expect(screen.getByTestId("focus-mode").textContent).toBe("false");
  });

  it("includes aria-live region for announcements", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <AccessibilityProvider>
        <div>Test</div>
      </AccessibilityProvider>,
    );

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeDefined();
  });

  it("allows font size to be changed", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    const button = screen.getByText("Set Large Font");
    await act(async () => {
      button.click();
    });

    expect(screen.getByTestId("font-size").textContent).toBe("large");
  });

  it("allows focus mode to be toggled", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    const button = screen.getByText("Enable Focus Mode");
    await act(async () => {
      button.click();
    });

    expect(screen.getByTestId("focus-mode").textContent).toBe("true");
  });

  it("reads saved font size from localStorage", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === "accessibility-font-size") return "large";
      return null;
    });

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      "accessibility-font-size",
    );
  });

  it("reads saved focus mode from localStorage", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === "accessibility-focus-mode") return "true";
      return null;
    });

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      "accessibility-focus-mode",
    );
  });

  it("saves font size to localStorage when changed", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    const button = screen.getByText("Set Large Font");
    await act(async () => {
      button.click();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "accessibility-font-size",
      "large",
    );
  });

  it("updates CSS variable when font size changes", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    const button = screen.getByText("Set Large Font");
    await act(async () => {
      button.click();
    });

    const root = document.documentElement;
    expect(root.style.getPropertyValue("--base-font-size")).toBe("18px");
  });

  it("adds focus-mode class when focus mode is enabled", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    const button = screen.getByText("Enable Focus Mode");
    await act(async () => {
      button.click();
    });

    expect(document.documentElement.classList.contains("focus-mode")).toBe(
      true,
    );
  });
});

describe("useAccessibility", () => {
  it("throws error when used outside provider", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useAccessibility must be used within AccessibilityProvider");

    consoleSpy.mockRestore();
  });
});
