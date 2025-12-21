import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { DevelopmentBanner } from "../DevelopmentBanner";

// Mock useTheme hook
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    themeConfig: {
      colors: {
        bg: "#000000",
        text: "#ffffff",
        accent: "#00ff00",
        border: "#333333",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
    theme: "matrix",
  }),
}));

describe("DevelopmentBanner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the development banner", () => {
    render(<DevelopmentBanner />);
    expect(screen.getByText(/dev/i)).toBeDefined();
  });

  it("displays development progress percentage", () => {
    render(<DevelopmentBanner />);
    expect(screen.getByText(/87%|progress/i)).toBeDefined();
  });

  it("shows test coverage metric", () => {
    render(<DevelopmentBanner />);
    expect(screen.getByText(/94|coverage/i)).toBeDefined();
  });

  it("displays build status", () => {
    render(<DevelopmentBanner />);
    expect(screen.getByText(/success|build/i)).toBeDefined();
  });

  it("can be dismissed", () => {
    render(<DevelopmentBanner />);

    const closeButton = screen.getByRole("button");
    fireEvent.click(closeButton);

    // After dismissing, the banner should not be visible
    expect(screen.queryByText(/development/i)).toBeNull();
  });

  it("animates over time", () => {
    render(<DevelopmentBanner />);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Component should still be rendered after animation phase
    expect(screen.getByText(/dev/i)).toBeDefined();
  });

  it("applies fixed positioning", () => {
    const { container } = render(<DevelopmentBanner />);
    const banner = container.firstChild as HTMLElement;
    expect(banner.className).toContain("fixed");
  });

  it("has high z-index for overlay", () => {
    const { container } = render(<DevelopmentBanner />);
    const banner = container.firstChild as HTMLElement;
    expect(banner.className).toContain("z-");
  });
});
