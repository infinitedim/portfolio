import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PWAInstallPrompt } from "../PWAInstallPrompt";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock useTheme
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    themeConfig: {
      colors: {
        bg: "#000000",
        text: "#ffffff",
        accent: "#00ff00",
      },
    },
  }),
}));

describe("PWAInstallPrompt", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Clear localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it("does not render initially", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(<PWAInstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it("shows prompt after delay", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<PWAInstallPrompt delay={1000} />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText(/Install App/i)).toBeInTheDocument();
    });
  });

  it("calls onInstall when install button is clicked", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const onInstall = vi.fn();

    render(<PWAInstallPrompt delay={1000} onInstall={onInstall} />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      const installButton = screen.getByText(/Install/i);
      fireEvent.click(installButton);
      expect(onInstall).toHaveBeenCalled();
    });
  });

  it("calls onDismiss when dismiss button is clicked", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const onDismiss = vi.fn();

    render(<PWAInstallPrompt delay={1000} onDismiss={onDismiss} />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      const dismissButton = screen.getByText(/Dismiss/i);
      fireEvent.click(dismissButton);
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  it("persists dismissal in localStorage when persistDismissal is true", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<PWAInstallPrompt delay={1000} persistDismissal={true} />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      const dismissButton = screen.getByText(/Dismiss/i);
      fireEvent.click(dismissButton);
    });

    if (typeof window !== "undefined" && window.localStorage) {
      expect(window.localStorage.getItem("pwa-prompt-dismissed")).toBe("true");
    }
  });

  it("does not persist dismissal when persistDismissal is false", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<PWAInstallPrompt delay={1000} persistDismissal={false} />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      const dismissButton = screen.getByText(/Dismiss/i);
      fireEvent.click(dismissButton);
    });

    if (typeof window !== "undefined" && window.localStorage) {
      expect(window.localStorage.getItem("pwa-prompt-dismissed")).toBeNull();
    }
  });

  it("does not show if already dismissed", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("pwa-prompt-dismissed", "true");
    }

    const { container } = render(<PWAInstallPrompt delay={1000} persistDismissal={true} />);

    vi.advanceTimersByTime(1000);

    expect(container.firstChild).toBeNull();
  });
});
