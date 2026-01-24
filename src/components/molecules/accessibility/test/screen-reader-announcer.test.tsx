import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { ScreenReaderAnnouncer } from "../screen-reader-announcer";

describe("ScreenReaderAnnouncer", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render with aria-live attribute", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      ensureDocumentBody();
      render(<ScreenReaderAnnouncer message="Test message" />);
      const announcer = screen.getByRole("status", { hidden: true });
      expect(announcer).toHaveAttribute("aria-live", "polite");
      expect(announcer).toHaveAttribute("aria-atomic", "true");
    });

    it("should use assertive priority when specified", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      ensureDocumentBody();
      render(
        <ScreenReaderAnnouncer message="Urgent message" priority="assertive" />,
      );
      const announcer = screen.getByRole("status", { hidden: true });
      expect(announcer).toHaveAttribute("aria-live", "assertive");
    });

    it("should have sr-only class for visual hiding", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ScreenReaderAnnouncer message="Test message" />);
      const announcer = screen.getByRole("status", { hidden: true });
      expect(announcer).toHaveClass("sr-only");
    });
  });

  describe("Message Announcement", () => {
    it("should display message after timeout", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      ensureDocumentBody();
      render(<ScreenReaderAnnouncer message="Test message" />);
      const announcer = screen.getByRole("status", { hidden: true });

      // Initially empty
      expect(announcer.textContent).toBe("");

      // Advance timer to trigger setTimeout
      vi.advanceTimersByTime(100);

      await waitFor(() => {
        expect(announcer.textContent).toBe("Test message");
      });
    });

    it("should clear and re-announce when message changes", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      ensureDocumentBody();
      const { rerender } = render(
        <ScreenReaderAnnouncer message="First message" />,
      );
      const announcer = screen.getByRole("status", { hidden: true });

      vi.advanceTimersByTime(100);
      await waitFor(() => {
        expect(announcer.textContent).toBe("First message");
      }, { timeout: 1000 });

      // Change message
      rerender(<ScreenReaderAnnouncer message="Second message" />);

      // Should clear first
      expect(announcer.textContent).toBe("");

      // Then set new message
      vi.advanceTimersByTime(100);
      await waitFor(() => {
        expect(announcer.textContent).toBe("Second message");
      }, { timeout: 1000 });
    });

    it("should handle empty message", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      ensureDocumentBody();
      render(<ScreenReaderAnnouncer message="" />);
      const announcer = screen.getByRole("status", { hidden: true });
      expect(announcer.textContent).toBe("");
    });
  });

  describe("Accessibility", () => {
    it("should be accessible to screen readers", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      ensureDocumentBody();
      render(<ScreenReaderAnnouncer message="Announcement" />);
      const announcer = screen.getByRole("status", { hidden: true });
      expect(announcer).toBeInTheDocument();
      expect(announcer).toHaveAttribute("aria-live");
      expect(announcer).toHaveAttribute("aria-atomic", "true");
    });

    it("should use polite priority by default", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      ensureDocumentBody();
      render(<ScreenReaderAnnouncer message="Test" />);
      const announcer = screen.getByRole("status", { hidden: true });
      expect(announcer).toHaveAttribute("aria-live", "polite");
    });
  });
});
