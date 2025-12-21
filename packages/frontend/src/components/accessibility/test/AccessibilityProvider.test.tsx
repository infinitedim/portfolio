import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AccessibilityProvider, useAccessibility } from "../AccessibilityProvider";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

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
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    window.matchMedia = createMatchMedia(false);
  });

  it("renders children correctly", () => {
    render(
      <AccessibilityProvider>
        <div data-testid="child">Child Content</div>
      </AccessibilityProvider>,
    );

    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByTestId("child").textContent).toBe("Child Content");
  });

  it("provides default context values", () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    expect(screen.getByTestId("font-size").textContent).toBe("medium");
    expect(screen.getByTestId("focus-mode").textContent).toBe("false");
  });

  it("includes aria-live region for announcements", () => {
    render(
      <AccessibilityProvider>
        <div>Test</div>
      </AccessibilityProvider>,
    );

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeDefined();
  });

  it("allows font size to be changed", async () => {
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
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useAccessibility must be used within AccessibilityProvider");

    consoleSpy.mockRestore();
  });
});
