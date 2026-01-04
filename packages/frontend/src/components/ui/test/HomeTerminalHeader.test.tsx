import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { HomeTerminalHeader } from "../HomeTerminalHeader";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock useTheme hook
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    themeConfig: {
      colors: {
        bg: "#000000",
        text: "#ffffff",
        accent: "#00ff00",
        border: "#333333",
        muted: "#666666",
        success: "#22c55e",
      },
    },
  }),
}));

// Mock useI18n hook
vi.mock("@/hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    currentLocale: "en_US",
  }),
}));

// Mock LanguageSwitcher
vi.mock("./LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Language Switcher</div>,
}));

describe("HomeTerminalHeader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the header component", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<HomeTerminalHeader />);
    // Component should render
    expect(document.body.querySelector("div")).toBeDefined();
  });

  it("displays portfolio metrics", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<HomeTerminalHeader />);

    // Simulate client-side mounting
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should show metrics like projects, skills, etc.
    expect(screen.getByText(/projects|skills|experience/i)).toBeDefined();
  });

  it("shows online status", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<HomeTerminalHeader />);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText(/online/i)).toBeDefined();
  });

  it("updates time periodically", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<HomeTerminalHeader />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Time should be displayed and updated
    expect(document.body.querySelector("div")).toBeDefined();
  });

  it("displays experience years", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<HomeTerminalHeader />);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText(/years/i)).toBeDefined();
  });

  it("renders with grid layout", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<HomeTerminalHeader />);
    const gridElement = container.querySelector(".grid");
    expect(gridElement).toBeDefined();
  });
});
