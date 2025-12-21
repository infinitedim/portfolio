import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AccessibilityMenu } from "../AccessibilityMenu";

// Mock the hooks
const mockAnnounceMessage = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetFocusMode = vi.fn();
const mockChangeTheme = vi.fn().mockReturnValue(true);

vi.mock("../AccessibilityProvider", () => ({
  useAccessibility: () => ({
    fontSize: "medium",
    setFontSize: mockSetFontSize,
    isHighContrast: false,
    isReducedMotion: false,
    focusMode: false,
    setFocusMode: mockSetFocusMode,
    announceMessage: mockAnnounceMessage,
  }),
}));

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "default",
    themeConfig: {
      colors: {
        bg: "#0d1117",
        text: "#e6edf3",
        accent: "#58a6ff",
        border: "#30363d",
        muted: "#8b949e",
        success: "#3fb950",
        error: "#f85149",
      },
    },
    changeTheme: mockChangeTheme,
  }),
}));

describe("AccessibilityMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the accessibility button", () => {
    render(<AccessibilityMenu />);

    const button = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });
    expect(button).toBeDefined();
  });

  it("has correct aria attributes on toggle button", () => {
    render(<AccessibilityMenu />);

    const button = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("aria-haspopup")).toBe("true");
  });

  it("opens menu when button is clicked", async () => {
    render(<AccessibilityMenu />);

    const button = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText("Accessibility Options")).toBeDefined();
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("announces menu open when opened", async () => {
    render(<AccessibilityMenu />);

    const button = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockAnnounceMessage).toHaveBeenCalledWith(
      "Accessibility menu opened",
      "polite",
    );
  });

  it("displays font size options when menu is open", async () => {
    render(<AccessibilityMenu />);

    const button = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText("Font Size:")).toBeDefined();
    expect(screen.getByText("Small")).toBeDefined();
    expect(screen.getByText("Medium")).toBeDefined();
    expect(screen.getByText("Large")).toBeDefined();
  });

  it("calls setFontSize when font size button is clicked", async () => {
    render(<AccessibilityMenu />);

    const toggleButton = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });

    await act(async () => {
      fireEvent.click(toggleButton);
    });

    const largeButton = screen.getByRole("button", {
      name: /set font size to large/i,
    });

    await act(async () => {
      fireEvent.click(largeButton);
    });

    expect(mockSetFontSize).toHaveBeenCalledWith("large");
    expect(mockAnnounceMessage).toHaveBeenCalledWith(
      "Font size changed to large",
      "polite",
    );
  });

  it("displays focus mode toggle button", async () => {
    render(<AccessibilityMenu />);

    const button = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText(/Focus Mode Off/)).toBeDefined();
  });

  it("calls setFocusMode when focus mode is toggled", async () => {
    render(<AccessibilityMenu />);

    const toggleButton = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });

    await act(async () => {
      fireEvent.click(toggleButton);
    });

    const focusModeButton = screen.getByRole("button", {
      name: /enable focus mode/i,
    });

    await act(async () => {
      fireEvent.click(focusModeButton);
    });

    expect(mockSetFocusMode).toHaveBeenCalledWith(true);
    expect(mockAnnounceMessage).toHaveBeenCalledWith(
      "Focus mode enabled",
      "polite",
    );
  });

  it("displays high contrast status", async () => {
    render(<AccessibilityMenu />);

    const button = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText(/High Contrast:/)).toBeDefined();
  });

  it("displays reduced motion status", async () => {
    render(<AccessibilityMenu />);

    const button = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText(/Reduced Motion:/)).toBeDefined();
  });

  it("displays theme toggle button with current theme", async () => {
    render(<AccessibilityMenu />);

    const button = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText(/Toggle Theme \(Current: default\)/)).toBeDefined();
  });

  it("calls changeTheme when theme toggle is clicked", async () => {
    render(<AccessibilityMenu />);

    const toggleButton = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });

    await act(async () => {
      fireEvent.click(toggleButton);
    });

    const themeButton = screen.getByRole("button", { name: /toggle theme/i });

    await act(async () => {
      fireEvent.click(themeButton);
    });

    expect(mockChangeTheme).toHaveBeenCalled();
  });

  it("displays close menu button", async () => {
    render(<AccessibilityMenu />);

    const button = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(
      screen.getByRole("button", { name: /close accessibility menu/i }),
    ).toBeDefined();
  });

  it("closes menu when close button is clicked", async () => {
    render(<AccessibilityMenu />);

    const toggleButton = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });

    await act(async () => {
      fireEvent.click(toggleButton);
    });

    expect(screen.getByText("Accessibility Options")).toBeDefined();

    const closeButton = screen.getByRole("button", {
      name: /close accessibility menu/i,
    });

    await act(async () => {
      fireEvent.click(closeButton);
    });

    expect(screen.queryByText("Accessibility Options")).toBeNull();
    expect(mockAnnounceMessage).toHaveBeenCalledWith(
      "Accessibility menu closed",
      "polite",
    );
  });

  it("has correct role and aria-label on menu", async () => {
    render(<AccessibilityMenu />);

    const button = screen.getByRole("button", {
      name: /open accessibility menu/i,
    });

    await act(async () => {
      fireEvent.click(button);
    });

    const menu = screen.getByRole("menu", { name: /accessibility options/i });
    expect(menu).toBeDefined();
  });

  it("is positioned fixed in top-left corner", () => {
    const { container } = render(<AccessibilityMenu />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("fixed");
    expect(wrapper.className).toContain("top-4");
    expect(wrapper.className).toContain("left-4");
  });
});
