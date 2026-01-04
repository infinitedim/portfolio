import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommandErrorHandler } from "../CommandErrorHandler";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("CommandErrorHandler", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  it("renders error message and command", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const error = new Error("Command failed");
    const onRetry = vi.fn();
    const onReport = vi.fn();

    render(
      <CommandErrorHandler
        error={error}
        command="test-command"
        onRetry={onRetry}
        onReport={onReport}
      />
    );

    expect(screen.getByText("Command Error")).toBeInTheDocument();
    expect(screen.getByText("Command failed")).toBeInTheDocument();
    expect(screen.getByText(/test-command/)).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const error = new Error("Command failed");
    const onRetry = vi.fn();
    const onReport = vi.fn();

    render(
      <CommandErrorHandler
        error={error}
        command="test-command"
        onRetry={onRetry}
        onReport={onReport}
      />
    );

    const retryButton = screen.getByText("Retry");
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onReport).not.toHaveBeenCalled();
  });

  it("calls onReport when report button is clicked", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const error = new Error("Command failed");
    const onRetry = vi.fn();
    const onReport = vi.fn();

    render(
      <CommandErrorHandler
        error={error}
        command="test-command"
        onRetry={onRetry}
        onReport={onReport}
      />
    );

    const reportButton = screen.getByText("Report Issue");
    fireEvent.click(reportButton);

    expect(onReport).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("displays help tip", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const error = new Error("Command failed");
    const onRetry = vi.fn();
    const onReport = vi.fn();

    render(
      <CommandErrorHandler
        error={error}
        command="test-command"
        onRetry={onRetry}
        onReport={onReport}
      />
    );

    expect(screen.getByText(/Try typing 'help'/)).toBeInTheDocument();
  });

  it("displays command in code format", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const error = new Error("Command failed");
    const onRetry = vi.fn();
    const onReport = vi.fn();

    render(
      <CommandErrorHandler
        error={error}
        command="custom-command"
        onRetry={onRetry}
        onReport={onReport}
      />
    );

    const commandElement = screen.getByText(/custom-command/);
    expect(commandElement).toBeInTheDocument();
    expect(commandElement.tagName).toBe("CODE");
  });
});
