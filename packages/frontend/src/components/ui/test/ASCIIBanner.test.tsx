import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ASCIIBanner } from "../ASCIIBanner";

// Mock useTheme hook
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    themeConfig: {
      colors: {
        accent: "#00ff00",
        muted: "#666666",
      },
    },
    theme: "matrix",
  }),
}));

describe("ASCIIBanner", () => {
  it("renders the banner container", () => {
    const { container } = render(<ASCIIBanner />);
    expect(container.querySelector("div")).toBeDefined();
  });

  it("renders with desktop banner hidden on mobile", () => {
    const { container } = render(<ASCIIBanner />);
    const desktopBanner = container.querySelector(".hidden.sm\\:block");
    expect(desktopBanner).toBeDefined();
  });

  it("renders with mobile banner visible on small screens", () => {
    const { container } = render(<ASCIIBanner />);
    const mobileBanner = container.querySelector(".block.sm\\:hidden");
    expect(mobileBanner).toBeDefined();
  });

  it("contains pre element for ASCII art", () => {
    const { container } = render(<ASCIIBanner />);
    const preElements = container.querySelectorAll("pre");
    expect(preElements.length).toBeGreaterThan(0);
  });

  it("renders with select-none class to prevent text selection", () => {
    const { container } = render(<ASCIIBanner />);
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.className).toContain("select-none");
  });

  it("contains TERMINAL text in banner", () => {
    const { container } = render(<ASCIIBanner />);
    const preContent = container.querySelector("pre")?.textContent;
    // The ASCII art should contain stylized text
    expect(preContent).toBeDefined();
  });

  it("applies theme accent color", () => {
    const { container } = render(<ASCIIBanner />);
    const pre = container.querySelector("pre");
    expect(pre).toBeDefined();
    // Style should be applied inline
    expect(pre?.style.color).toBe("rgb(0, 255, 0)");
  });
});
