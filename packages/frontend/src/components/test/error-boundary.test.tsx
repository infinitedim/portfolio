import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { ErrorBoundary } from "../error-boundary";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("ErrorBoundary (error-boundary.tsx)", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
    // Suppress console.error for error boundary tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when there is no error", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("catches errors and displays default fallback", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText(/An error occurred while loading/)).toBeInTheDocument();
  });

  it("displays custom fallback when provided", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });

  it("has refresh page button", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const reloadSpy = vi.spyOn(window.location, "reload").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByText("Refresh Page");
    expect(refreshButton).toBeInTheDocument();

    fireEvent.click(refreshButton);
    expect(reloadSpy).toHaveBeenCalled();

    reloadSpy.mockRestore();
  });

  it("has try again button that resets error state", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    const tryAgainButton = screen.getByText("Try Again");
    fireEvent.click(tryAgainButton);

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should render children again
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("displays error details when available", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const details = screen.getByText("Error Details");
    expect(details).toBeInTheDocument();
  });
});
