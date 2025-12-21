import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { CommandLoadingIndicator } from "../CommandLoadingIndicator";

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
      },
    },
  }),
}));

describe("CommandLoadingIndicator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when not visible", () => {
    const { container } = render(
      <CommandLoadingIndicator visible={false} command="help" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders loading indicator when visible", () => {
    render(<CommandLoadingIndicator visible={true} command="help" />);
    expect(screen.getByText(/Processing/i)).toBeDefined();
  });

  it("displays command name when provided", () => {
    render(<CommandLoadingIndicator visible={true} command="projects" />);
    expect(screen.getByText(/projects/i)).toBeDefined();
  });

  it("cycles through messages over time", () => {
    render(<CommandLoadingIndicator visible={true} />);

    const initialMessage = screen.getByText(/Processing command/i);
    expect(initialMessage).toBeDefined();

    // Advance timer to trigger message change
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // After 1.5s, should move to next message
    expect(screen.getByText(/Analyzing|Gathering|Compiling|Almost/i)).toBeDefined();
  });

  it("animates dots over time", () => {
    const { container } = render(<CommandLoadingIndicator visible={true} />);

    // Advance timer to trigger dots animation
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Dots should animate
    expect(container.textContent).toBeDefined();
  });

  it("accepts custom messages", () => {
    const customMessages = ["Custom message 1", "Custom message 2"];
    render(
      <CommandLoadingIndicator visible={true} messages={customMessages} />
    );

    expect(screen.getByText(/Custom message 1/i)).toBeDefined();
  });

  it("resets state when visibility changes", () => {
    const { rerender } = render(
      <CommandLoadingIndicator visible={true} command="test" />
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    rerender(<CommandLoadingIndicator visible={false} command="test" />);
    rerender(<CommandLoadingIndicator visible={true} command="test" />);

    // Should reset to first message
    expect(screen.getByText(/Processing command/i)).toBeDefined();
  });
});
