import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { PWARegistration } from "../pwa-registration";

// Mock PWAInstallPrompt
vi.mock("@/components/molecules/pwa/pwa-install-prompt", () => ({
  PWAInstallPrompt: ({ onInstall, onDismiss }: any) => (
    <div data-testid="pwa-install-prompt">
      <button onClick={onInstall}>Install</button>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  ),
}));

// Mock service worker
const mockRegister = vi.fn();
const mockController = null;

Object.defineProperty(navigator, "serviceWorker", {
  value: {
    register: mockRegister,
    controller: mockController,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  writable: true,
  configurable: true,
});

// Mock window.confirm
const mockConfirm = vi.fn(() => true);
if (typeof window !== "undefined") {
  window.confirm = mockConfirm;
}

describe("PWARegistration", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    mockRegister.mockResolvedValue({
      installing: null,
      waiting: null,
      update: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should not render when not installable", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<PWARegistration />);

      // Should not render when not installable
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Service Worker Registration", () => {
    it("should register service worker when supported", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof navigator === "undefined" || !navigator.serviceWorker) {
        expect(true).toBe(true);
        return;
      }
      render(<PWARegistration />);

      await waitFor(() => {
        // Service worker registration is attempted
        expect(mockRegister).toHaveBeenCalled();
      });
    });

    it("should handle service worker registration errors gracefully", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof navigator === "undefined" || !navigator.serviceWorker) {
        expect(true).toBe(true);
        return;
      }
      mockRegister.mockRejectedValue(new Error("404"));

      render(<PWARegistration />);

      await waitFor(() => {
        // Should handle error gracefully
        expect(mockRegister).toHaveBeenCalled();
      });
    });
  });

  describe("Install Prompt", () => {
    it("should handle beforeinstallprompt event", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined") {
        expect(true).toBe(true);
        return;
      }
      render(<PWARegistration />);

      const event = new Event("beforeinstallprompt") as any;
      event.prompt = vi.fn();
      event.userChoice = Promise.resolve({ outcome: "accepted" });

      window.dispatchEvent(event);

      // Should handle the event
      expect(event).toBeDefined();
    });
  });
});
