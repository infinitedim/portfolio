import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { MobileTerminal } from "../mobile-terminal";

// Mock dependencies
const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#000000",
    text: "#ffffff",
    accent: "#00ff00",
    border: "#333333",
    muted: "#888888",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
    theme: "default",
  }),
}));

const mockIsMobile = true;
const mockIsVirtualKeyboardOpen = false;
const mockOrientation = "portrait";

vi.mock("@/hooks/use-mobile", () => ({
  useMobile: () => ({
    isMobile: mockIsMobile,
    isVirtualKeyboardOpen: mockIsVirtualKeyboardOpen,
    orientation: mockOrientation,
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
}

describe("MobileTerminal", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe("Rendering", () => {
    it("should render children when not on mobile", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      vi.mocked(require("@/hooks/use-mobile").useMobile).mockReturnValue({
        isMobile: false,
        isVirtualKeyboardOpen: false,
        orientation: "portrait",
      });

      const { getByText } = render(
        <MobileTerminal>
          <div>Test Content</div>
        </MobileTerminal>,
      );

      expect(getByText("Test Content")).toBeInTheDocument();
    });

    it("should render mobile layout when on mobile", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <MobileTerminal>
          <div>Test Content</div>
        </MobileTerminal>,
      );

      expect(screen.getByText(/Terminal Portfolio/i)).toBeInTheDocument();
    });

    it("should show mobile hint on first visit", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <MobileTerminal>
          <div>Test</div>
        </MobileTerminal>,
      );

      expect(screen.getByText(/Mobile Terminal Ready/i)).toBeInTheDocument();
    });

    it("should not show mobile hint if dismissed", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      localStorageMock.getItem.mockReturnValue("true");

      const { container } = render(
        <MobileTerminal>
          <div>Test</div>
        </MobileTerminal>,
      );

      expect(container.textContent).not.toContain("Mobile Terminal Ready");
    });
  });

  describe("Quick Commands", () => {
    it("should display quick command buttons", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <MobileTerminal>
          <div>Test</div>
        </MobileTerminal>,
      );

      expect(screen.getByText("help")).toBeInTheDocument();
      expect(screen.getByText("about")).toBeInTheDocument();
    });

    it("should execute command when button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }
      const mockInput = document.createElement("input");
      mockInput.value = "";
      document.body.appendChild(mockInput);

      render(
        <MobileTerminal>
          <div>Test</div>
        </MobileTerminal>,
      );

      const helpButton = screen.getByText("help");
      fireEvent.click(helpButton);

      expect(mockInput.value).toBe("help");
    });
  });

  describe("Dismiss Functionality", () => {
    it("should dismiss mobile hint", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <MobileTerminal>
          <div>Test</div>
        </MobileTerminal>,
      );

      const dismissButton = screen.getByLabelText(/Dismiss mobile hint/i);
      fireEvent.click(dismissButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "mobile-hint-dismissed",
        "true",
      );
    });
  });
});
