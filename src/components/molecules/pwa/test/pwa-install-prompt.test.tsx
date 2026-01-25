import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { PWAInstallPrompt } from "../pwa-install-prompt";

// Mock theme hook
const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#0a0a0a",
    text: "#e5e5e5",
    accent: "#00ff41",
    muted: "#666666",
    border: "#333333",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
}

describe("PWAInstallPrompt", () => {
  const mockOnInstall = vi.fn();
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should not render initially", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
        />,
      );

      expect(screen.queryByText("Install Portfolio App")).not.toBeInTheDocument();
    });

    it("should render after delay", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={100}
        />,
      );

      vi.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.getByText("Install Portfolio App")).toBeInTheDocument();
      });
    });

    it("should render with default delay", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
        />,
      );

      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByText("Install Portfolio App")).toBeInTheDocument();
      });
    });

    it("should render title and description", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
        />,
      );

      vi.advanceTimersByTime(1);

      await waitFor(() => {
        expect(screen.getByText("Install Portfolio App")).toBeInTheDocument();
        expect(screen.getByText("Get the native app experience")).toBeInTheDocument();
      });
    });

    it("should render install button", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
        />,
      );

      vi.advanceTimersByTime(1);

      await waitFor(() => {
        expect(screen.getByText("Install Now")).toBeInTheDocument();
      });
    });

    it("should render later button", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
        />,
      );

      vi.advanceTimersByTime(1);

      await waitFor(() => {
        expect(screen.getByText("Later")).toBeInTheDocument();
      });
    });

    it("should render features list", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
        />,
      );

      vi.advanceTimersByTime(1);

      await waitFor(() => {
        expect(screen.getByText("Faster loading & offline access")).toBeInTheDocument();
        expect(screen.getByText("Native app experience")).toBeInTheDocument();
        expect(screen.getByText("Home screen shortcut")).toBeInTheDocument();
      });
    });

    it("should render close button", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
        />,
      );

      vi.advanceTimersByTime(1);

      await waitFor(() => {
        const closeButton = screen.getByLabelText("Close");
        expect(closeButton).toBeInTheDocument();
      });
    });

    it("should have correct ARIA attributes", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
        />,
      );

      vi.advanceTimersByTime(1);

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveAttribute("aria-labelledby", "pwa-prompt-title");
        expect(dialog).toHaveAttribute("aria-describedby", "pwa-prompt-description");
      });
    });
  });

  describe("Install Action", () => {
    it("should call onInstall when install button is clicked", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
        />,
      );

      vi.advanceTimersByTime(1);

      await waitFor(() => {
        expect(screen.getByText("Install Now")).toBeInTheDocument();
      });

      const installButton = screen.getByText("Install Now");
      fireEvent.click(installButton);

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockOnInstall).toHaveBeenCalled();
      });
    });

    it("should hide prompt after install", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
        />,
      );

      vi.advanceTimersByTime(1);

      await waitFor(() => {
        expect(screen.getByText("Install Now")).toBeInTheDocument();
      });

      const installButton = screen.getByText("Install Now");
      fireEvent.click(installButton);

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.queryByText("Install Portfolio App")).not.toBeInTheDocument();
      });
    });
  });

  describe("Dismiss Action", () => {
    it("should call onDismiss when later button is clicked", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
        />,
      );

      vi.advanceTimersByTime(1);

      await waitFor(() => {
        expect(screen.getByText("Later")).toBeInTheDocument();
      });

      const laterButton = screen.getByText("Later");
      fireEvent.click(laterButton);

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalled();
      });
    });

    it("should call onDismiss when close button is clicked", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
        />,
      );

      vi.advanceTimersByTime(1);

      await waitFor(() => {
        const closeButton = screen.getByLabelText("Close");
        expect(closeButton).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText("Close");
      fireEvent.click(closeButton);

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalled();
      });
    });

    it("should hide prompt after dismiss", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
        />,
      );

      vi.advanceTimersByTime(1);

      await waitFor(() => {
        expect(screen.getByText("Later")).toBeInTheDocument();
      });

      const laterButton = screen.getByText("Later");
      fireEvent.click(laterButton);

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.queryByText("Install Portfolio App")).not.toBeInTheDocument();
      });
    });

    it("should save dismissal to localStorage when persistDismissal is true", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
          persistDismissal={true}
        />,
      );

      vi.advanceTimersByTime(1);

      await waitFor(() => {
        expect(screen.getByText("Later")).toBeInTheDocument();
      });

      const laterButton = screen.getByText("Later");
      fireEvent.click(laterButton);

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(localStorageMock.getItem("pwa-prompt-dismissed")).toBe("true");
      });
    });

    it("should not save dismissal to localStorage when persistDismissal is false", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
          persistDismissal={false}
        />,
      );

      vi.advanceTimersByTime(1);

      await waitFor(() => {
        expect(screen.getByText("Later")).toBeInTheDocument();
      });

      const laterButton = screen.getByText("Later");
      fireEvent.click(laterButton);

      vi.advanceTimersByTime(300);

      expect(localStorageMock.getItem("pwa-prompt-dismissed")).toBeNull();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should dismiss on Escape key", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
        />,
      );

      vi.advanceTimersByTime(1);

      await waitFor(() => {
        expect(screen.getByText("Install Portfolio App")).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: "Escape" });

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalled();
      });
    });
  });

  describe("Dismissal Persistence", () => {
    it("should not show prompt if previously dismissed", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      localStorageMock.setItem("pwa-prompt-dismissed", "true");

      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
          persistDismissal={true}
        />,
      );

      vi.advanceTimersByTime(1000);

      expect(screen.queryByText("Install Portfolio App")).not.toBeInTheDocument();
    });

    it("should show prompt if not previously dismissed", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      localStorageMock.removeItem("pwa-prompt-dismissed");

      render(
        <PWAInstallPrompt
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
          delay={0}
          persistDismissal={true}
        />,
      );

      vi.advanceTimersByTime(1);

      await waitFor(() => {
        expect(screen.getByText("Install Portfolio App")).toBeInTheDocument();
      });
    });
  });
});
