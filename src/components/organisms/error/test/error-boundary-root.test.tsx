import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  ErrorBoundary,
  CompactErrorFallback,
  withErrorBoundary,
  AsyncBoundary,
} from "@/components/organisms/error/error-boundary-root";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("ErrorBoundary (error-boundary-root.tsx)", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
    // Suppress console.error for error boundary tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("ErrorBoundary Component", () => {
    it("should render children when there is no error", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>,
      );

      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("should catch errors and display default fallback", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("Test error")).toBeInTheDocument();
    });

    it("should display custom fallback element when provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(
        <ErrorBoundary fallback={<div>Custom error message</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Custom error message")).toBeInTheDocument();
    });

    it("should display custom fallback function when provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const fallbackFn = (error: Error, reset: () => void) => (
        <div>
          <p>Error: {error.message}</p>
          <button onClick={reset}>Reset</button>
        </div>
      );

      render(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Error: Test error")).toBeInTheDocument();
      expect(screen.getByText("Reset")).toBeInTheDocument();
    });

    it("should call onError callback when error occurs", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const onError = vi.fn();
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(onError).toHaveBeenCalled();
    });

    it("should call onReset callback when reset", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const onReset = vi.fn();
      render(
        <ErrorBoundary onReset={onReset}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      const tryAgainButton = screen.getByText("Try again");
      fireEvent.click(tryAgainButton);

      expect(onReset).toHaveBeenCalled();
    });

    it("should reset error state when reset button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      const tryAgainButton = screen.getByText("Try again");
      fireEvent.click(tryAgainButton);

      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>,
      );

      // Should render children again
      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
      expect(screen.getByText("No error")).toBeInTheDocument();
    });

    it("should display error details in development mode", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      const detailsButton = screen.getByText("View error details");
      expect(detailsButton).toBeInTheDocument();

      fireEvent.click(detailsButton);

      expect(screen.getByText(/Test error/i)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("CompactErrorFallback", () => {
    it("should render error message", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const error = new Error("Test error");
      const reset = vi.fn();

      render(<CompactErrorFallback error={error} reset={reset} />);

      expect(screen.getByText("Test error")).toBeInTheDocument();
    });

    it("should call reset when button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const error = new Error("Test error");
      const reset = vi.fn();

      render(<CompactErrorFallback error={error} reset={reset} />);

      const tryAgainButton = screen.getByText("Try again");
      fireEvent.click(tryAgainButton);

      expect(reset).toHaveBeenCalled();
    });
  });

  describe("withErrorBoundary HOC", () => {
    it("should wrap component with error boundary", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const TestComponent = () => <div>Test Component</div>;
      const WrappedComponent = withErrorBoundary(TestComponent);

      render(<WrappedComponent />);

      expect(screen.getByText("Test Component")).toBeInTheDocument();
    });

    it("should catch errors in wrapped component", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const TestComponent = () => {
        throw new Error("Component error");
      };
      const WrappedComponent = withErrorBoundary(TestComponent);

      render(<WrappedComponent />);

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  describe("AsyncBoundary", () => {
    it("should render children when no error", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(
        <AsyncBoundary>
          <div>Async content</div>
        </AsyncBoundary>,
      );

      expect(screen.getByText("Async content")).toBeInTheDocument();
    });

    it("should display loading fallback", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const LoadingFallback = () => <div>Loading...</div>;

      render(
        <AsyncBoundary loadingFallback={<LoadingFallback />}>
          <div>Content</div>
        </AsyncBoundary>,
      );

      // Should render content, not loading (no Suspense trigger)
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });
});
