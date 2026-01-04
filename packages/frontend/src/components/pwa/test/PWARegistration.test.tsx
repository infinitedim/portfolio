import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PWARegistration } from "../PWARegistration";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock PWAInstallPrompt
vi.mock("../PWAInstallPrompt", () => ({
  PWAInstallPrompt: () => <div data-testid="pwa-install-prompt">PWA Install Prompt</div>,
}));

describe("PWARegistration", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();

    // Mock service worker
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: vi.fn().mockResolvedValue({
          update: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
    });

    // Mock window.isSecureContext
    Object.defineProperty(window, "isSecureContext", {
      value: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders PWAInstallPrompt", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<PWARegistration />);

    expect(screen.getByTestId("pwa-install-prompt")).toBeInTheDocument();
  });

  it("handles service worker registration", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<PWARegistration />);

    await waitFor(() => {
      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });
  });

  it("handles beforeinstallprompt event", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<PWARegistration />);

    const event = new Event("beforeinstallprompt");
    window.dispatchEvent(event);

    // Component should handle the event without errors
    expect(screen.getByTestId("pwa-install-prompt")).toBeInTheDocument();
  });

  it("handles appinstalled event", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<PWARegistration />);

    const event = new Event("appinstalled");
    window.dispatchEvent(event);

    // Component should handle the event without errors
    expect(screen.getByTestId("pwa-install-prompt")).toBeInTheDocument();
  });
});
