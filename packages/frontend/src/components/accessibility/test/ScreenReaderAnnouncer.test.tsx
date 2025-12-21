import { render, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ScreenReaderAnnouncer } from "../ScreenReaderAnnouncer";

describe("ScreenReaderAnnouncer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with sr-only class for screen readers", () => {
    const { container } = render(<ScreenReaderAnnouncer message="" />);

    const announcer = container.firstChild as HTMLElement;
    expect(announcer.className).toContain("sr-only");
  });

  it("has aria-live attribute set to polite by default", () => {
    const { container } = render(<ScreenReaderAnnouncer message="Test" />);

    const announcer = container.firstChild as HTMLElement;
    expect(announcer.getAttribute("aria-live")).toBe("polite");
  });

  it("has aria-live attribute set to assertive when priority is assertive", () => {
    const { container } = render(
      <ScreenReaderAnnouncer message="Urgent" priority="assertive" />,
    );

    const announcer = container.firstChild as HTMLElement;
    expect(announcer.getAttribute("aria-live")).toBe("assertive");
  });

  it("has aria-atomic set to true", () => {
    const { container } = render(<ScreenReaderAnnouncer message="Test" />);

    const announcer = container.firstChild as HTMLElement;
    expect(announcer.getAttribute("aria-atomic")).toBe("true");
  });

  it("updates content when message changes", async () => {
    const { container, rerender } = render(
      <ScreenReaderAnnouncer message="" />,
    );

    const announcer = container.firstChild as HTMLElement;
    expect(announcer.textContent).toBe("");

    rerender(<ScreenReaderAnnouncer message="New announcement" />);

    // Wait for the setTimeout to complete
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(announcer.textContent).toBe("New announcement");
  });

  it("clears content before setting new message", async () => {
    const { container, rerender } = render(
      <ScreenReaderAnnouncer message="Initial" />,
    );

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const announcer = container.firstChild as HTMLElement;
    expect(announcer.textContent).toBe("Initial");

    // Change message
    rerender(<ScreenReaderAnnouncer message="Updated" />);

    // Content should be cleared first
    expect(announcer.textContent).toBe("");

    // Then set to new value after delay
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(announcer.textContent).toBe("Updated");
  });

  it("does not update if message is empty", async () => {
    const { container, rerender } = render(
      <ScreenReaderAnnouncer message="Initial" />,
    );

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const announcer = container.firstChild as HTMLElement;
    expect(announcer.textContent).toBe("Initial");

    // Change to empty message - should not trigger the useEffect logic that clears
    rerender(<ScreenReaderAnnouncer message="" />);

    // Content remains as the condition checks for truthy message
    expect(announcer.textContent).toBe("Initial");
  });

  it("renders as a div element", () => {
    const { container } = render(<ScreenReaderAnnouncer message="Test" />);

    expect(container.firstChild?.nodeName).toBe("DIV");
  });

  it("handles rapid message changes", async () => {
    const { container, rerender } = render(
      <ScreenReaderAnnouncer message="First" />,
    );

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    rerender(<ScreenReaderAnnouncer message="Second" />);

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    rerender(<ScreenReaderAnnouncer message="Third" />);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const announcer = container.firstChild as HTMLElement;
    expect(announcer.textContent).toBe("Third");
  });

  it("maintains priority when message updates", async () => {
    const { container, rerender } = render(
      <ScreenReaderAnnouncer message="First" priority="assertive" />,
    );

    const announcer = container.firstChild as HTMLElement;
    expect(announcer.getAttribute("aria-live")).toBe("assertive");

    rerender(<ScreenReaderAnnouncer message="Second" priority="assertive" />);

    expect(announcer.getAttribute("aria-live")).toBe("assertive");
  });

  it("can change priority with message", async () => {
    const { container, rerender } = render(
      <ScreenReaderAnnouncer message="Normal" priority="polite" />,
    );

    const announcer = container.firstChild as HTMLElement;
    expect(announcer.getAttribute("aria-live")).toBe("polite");

    rerender(<ScreenReaderAnnouncer message="Urgent!" priority="assertive" />);

    expect(announcer.getAttribute("aria-live")).toBe("assertive");
  });
});
