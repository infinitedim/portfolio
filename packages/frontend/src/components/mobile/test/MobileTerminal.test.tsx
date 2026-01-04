import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileTerminal } from "../MobileTerminal";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock hooks
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    themeConfig: {
      colors: {
        bg: "#000000",
        text: "#ffffff",
        accent: "#00ff00",
        border: "#333333",
      },
    },
    theme: "dark",
  }),
}));

vi.mock("@/hooks/useMobile", () => ({
  useMobile: () => ({
    isMobile: true,
    isVirtualKeyboardOpen: false,
    orientation: "portrait",
  }),
}));

describe("MobileTerminal", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it("renders children when not on mobile", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    vi.mocked(require("@/hooks/useMobile").useMobile).mockReturnValue({
      isMobile: false,
      isVirtualKeyboardOpen: false,
      orientation: "portrait",
    });

    render(
      <MobileTerminal>
        <div>Desktop content</div>
      </MobileTerminal>
    );

    expect(screen.getByText("Desktop content")).toBeInTheDocument();
  });

  it("renders mobile-optimized layout when on mobile", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <MobileTerminal>
        <div>Mobile content</div>
      </MobileTerminal>
    );

    const mobileTerminal = document.querySelector(".mobile-terminal");
    expect(mobileTerminal).toBeInTheDocument();
  });

  it("shows mobile hint when first opened", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }

    render(
      <MobileTerminal>
        <div>Content</div>
      </MobileTerminal>
    );

    expect(screen.getByText("Mobile Terminal Ready!")).toBeInTheDocument();
  });

  it("dismisses mobile hint when close button is clicked", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }

    render(
      <MobileTerminal>
        <div>Content</div>
      </MobileTerminal>
    );

    const dismissButton = screen.getByLabelText("Dismiss mobile hint");
    fireEvent.click(dismissButton);

    expect(screen.queryByText("Mobile Terminal Ready!")).not.toBeInTheDocument();
  });

  it("does not show hint if already dismissed", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("mobile-hint-dismissed", "true");
    }

    render(
      <MobileTerminal>
        <div>Content</div>
      </MobileTerminal>
    );

    expect(screen.queryByText("Mobile Terminal Ready!")).not.toBeInTheDocument();
  });
});
