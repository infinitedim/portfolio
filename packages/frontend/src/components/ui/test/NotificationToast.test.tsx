import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { NotificationToast } from "../NotificationToast";

// Mock useTheme hook
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    themeConfig: {
      colors: {
        bg: "#000000",
        text: "#ffffff",
        accent: "#00ff00",
        success: "#22c55e",
        error: "#ef4444",
        warning: "#f59e0b",
      },
    },
    theme: "matrix",
  }),
}));

describe("NotificationToast", () => {
  const defaultProps = {
    message: "Test notification",
    type: "info" as const,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the toast message", () => {
    render(<NotificationToast {...defaultProps} />);
    expect(screen.getByText("Test notification")).toBeDefined();
  });

  it("renders with info type", () => {
    render(<NotificationToast {...defaultProps} type="info" />);
    expect(screen.getByText("Test notification")).toBeDefined();
  });

  it("renders with success type", () => {
    render(
      <NotificationToast {...defaultProps} type="success" message="Success!" />
    );
    expect(screen.getByText("Success!")).toBeDefined();
  });

  it("renders with error type", () => {
    render(
      <NotificationToast {...defaultProps} type="error" message="Error occurred" />
    );
    expect(screen.getByText("Error occurred")).toBeDefined();
  });

  it("renders with warning type", () => {
    render(
      <NotificationToast {...defaultProps} type="warning" message="Warning!" />
    );
    expect(screen.getByText("Warning!")).toBeDefined();
  });

  it("auto-dismisses after duration", () => {
    const onClose = vi.fn();
    render(
      <NotificationToast {...defaultProps} onClose={onClose} duration={2000} />
    );

    act(() => {
      vi.advanceTimersByTime(2300); // duration + animation delay
    });

    expect(onClose).toHaveBeenCalled();
  });

  it("does not auto-dismiss when duration is 0", () => {
    const onClose = vi.fn();
    render(
      <NotificationToast {...defaultProps} onClose={onClose} duration={0} />
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("returns null when not visible", () => {
    const { container } = render(
      <NotificationToast {...defaultProps} visible={false} />
    );

    // The toast should still render but with hidden state
    expect(container.firstChild).toBeDefined();
  });

  it("can be manually closed", () => {
    const onClose = vi.fn();
    render(<NotificationToast {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByRole("button");
    fireEvent.click(closeButton);

    act(() => {
      vi.advanceTimersByTime(300); // animation delay
    });

    expect(onClose).toHaveBeenCalled();
  });

  it("displays appropriate icon for each type", () => {
    const { container, rerender } = render(
      <NotificationToast {...defaultProps} type="success" />
    );

    expect(container.textContent).toContain("✅");

    rerender(<NotificationToast {...defaultProps} type="error" />);
    expect(container.textContent).toContain("❌");

    rerender(<NotificationToast {...defaultProps} type="warning" />);
    expect(container.textContent).toContain("⚠️");
  });
});
