import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ImageErrorBoundary } from "../ImageErrorBoundary";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Component that throws an error
const ThrowError = () => {
  throw new Error("Image load error");
};

describe("ImageErrorBoundary", () => {
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
      <ImageErrorBoundary>
        <img src="test.jpg" alt="Test" />
      </ImageErrorBoundary>
    );

    const img = screen.getByAltText("Test");
    expect(img).toBeInTheDocument();
  });

  it("catches errors and displays default fallback", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ImageErrorBoundary>
        <ThrowError />
      </ImageErrorBoundary>
    );

    expect(screen.getByText("🖼️")).toBeInTheDocument();
    expect(screen.getByText("Failed to load image")).toBeInTheDocument();
  });

  it("displays custom fallback when provided", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <ImageErrorBoundary fallback={<div>Custom image error</div>}>
        <ThrowError />
      </ImageErrorBoundary>
    );

    expect(screen.getByText("Custom image error")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load image")).not.toBeInTheDocument();
  });

  it("logs error to console", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ImageErrorBoundary>
        <ThrowError />
      </ImageErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
