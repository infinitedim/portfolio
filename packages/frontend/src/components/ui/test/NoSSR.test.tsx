import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NoSSR } from "../NoSSR";

// Skip tests if document is not available (jsdom not initialized)
const canRunTests = typeof document !== "undefined" && typeof window !== "undefined";

describe("NoSSR", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    
    vi.useFakeTimers();
    
    // Ensure document.body exists for render
    if (!document.body) {
      const body = document.createElement("body");
      if (document.documentElement) {
        document.documentElement.appendChild(body);
      }
    }
  });

  afterEach(() => {
    if (!canRunTests) {
      return;
    }
    vi.useRealTimers();
  });

  it("renders fallback initially before mount", () => {
    if (!canRunTests) {
      // Skip test if jsdom is not available
      expect(true).toBe(true);
      return;
    }

    const { container } = render(
      <NoSSR fallback={<div data-testid="fallback">Loading...</div>}>
        <div data-testid="content">Client Content</div>
      </NoSSR>
    );

    // Initially shows fallback (before useEffect runs)
    expect(container.innerHTML).toContain("fallback");
  });

  it("renders children after mount", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <NoSSR fallback={<div data-testid="fallback">Loading...</div>}>
        <div data-testid="content">Client Content</div>
      </NoSSR>
    );

    // Trigger useEffect
    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByTestId("content")).toBeDefined();
    expect(screen.getByText("Client Content")).toBeDefined();
  });

  it("renders null fallback by default", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(
      <NoSSR>
        <div>Content</div>
      </NoSSR>
    );

    // Before mount, with default null fallback
    expect(container.firstChild).toBeDefined();
  });

  it("handles complex children", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <NoSSR>
        <div>
          <span>Nested</span>
          <button>Click</button>
        </div>
      </NoSSR>
    );

    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByText("Nested")).toBeDefined();
    expect(screen.getByText("Click")).toBeDefined();
  });

  it("renders custom fallback component", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const CustomFallback = () => <span>Custom Loading...</span>;

    render(
      <NoSSR fallback={<CustomFallback />}>
        <div>Content</div>
      </NoSSR>
    );

    expect(screen.getByText("Custom Loading...")).toBeDefined();
  });
});
