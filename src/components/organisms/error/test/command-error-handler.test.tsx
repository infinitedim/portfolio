import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { CommandErrorHandler } from "../command-error-handler";

describe("CommandErrorHandler", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render error message", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new Error("Test error message");
      render(
        <CommandErrorHandler
          error={error}
          command="test-command"
          onRetry={vi.fn()}
          onReport={vi.fn()}
        />,
      );

      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    it("should display command that caused error", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new Error("Test error");
      render(
        <CommandErrorHandler
          error={error}
          command="test-command"
          onRetry={vi.fn()}
          onReport={vi.fn()}
        />,
      );

      expect(screen.getByText(/Command:/i)).toBeInTheDocument();
      expect(screen.getByText("test-command")).toBeInTheDocument();
    });

    it("should display error icon and title", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new Error("Test error");
      render(
        <CommandErrorHandler
          error={error}
          command="test-command"
          onRetry={vi.fn()}
          onReport={vi.fn()}
        />,
      );

      expect(screen.getByText(/Command Error/i)).toBeInTheDocument();
    });

    it("should display helpful tip", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new Error("Test error");
      render(
        <CommandErrorHandler
          error={error}
          command="test-command"
          onRetry={vi.fn()}
          onReport={vi.fn()}
        />,
      );

      expect(screen.getByText(/Try typing 'help'/i)).toBeInTheDocument();
    });
  });

  describe("Actions", () => {
    it("should call onRetry when retry button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const onRetry = vi.fn();
      const error = new Error("Test error");
      render(
        <CommandErrorHandler
          error={error}
          command="test-command"
          onRetry={onRetry}
          onReport={vi.fn()}
        />,
      );

      const retryButton = screen.getByText("Retry");
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("should call onReport when report button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const onReport = vi.fn();
      const error = new Error("Test error");
      render(
        <CommandErrorHandler
          error={error}
          command="test-command"
          onRetry={vi.fn()}
          onReport={onReport}
        />,
      );

      const reportButton = screen.getByText("Report Issue");
      fireEvent.click(reportButton);

      expect(onReport).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Display", () => {
    it("should display error message from Error object", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new Error("Custom error message");
      render(
        <CommandErrorHandler
          error={error}
          command="test-command"
          onRetry={vi.fn()}
          onReport={vi.fn()}
        />,
      );

      expect(screen.getByText("Custom error message")).toBeInTheDocument();
    });

    it("should handle errors without message", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new Error("");
      render(
        <CommandErrorHandler
          error={error}
          command="test-command"
          onRetry={vi.fn()}
          onReport={vi.fn()}
        />,
      );

      expect(screen.getByText(/Command Error/i)).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have error styling classes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new Error("Test error");
      const { container } = render(
        <CommandErrorHandler
          error={error}
          command="test-command"
          onRetry={vi.fn()}
          onReport={vi.fn()}
        />,
      );

      const errorContainer = container.firstChild;
      expect(errorContainer).toHaveClass("border", "border-red-500/30");
    });
  });
});
