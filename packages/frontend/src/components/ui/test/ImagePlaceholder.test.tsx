import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ImagePlaceholder } from "../ImagePlaceholder";

// Mock cn utility
vi.mock("@/lib/utils/utils", () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
}));

describe("ImagePlaceholder", () => {
  it("renders with default dimensions", () => {
    const { container } = render(<ImagePlaceholder />);
    const placeholder = container.firstChild as HTMLElement;

    expect(placeholder.style.width).toBe("400px");
    expect(placeholder.style.height).toBe("300px");
  });

  it("renders with custom dimensions", () => {
    const { container } = render(
      <ImagePlaceholder width={800} height={600} />
    );
    const placeholder = container.firstChild as HTMLElement;

    expect(placeholder.style.width).toBe("800px");
    expect(placeholder.style.height).toBe("600px");
  });

  it("applies custom className", () => {
    const { container } = render(
      <ImagePlaceholder className="custom-class" />
    );
    const placeholder = container.firstChild as HTMLElement;

    expect(placeholder.className).toContain("custom-class");
  });

  it("contains SVG placeholder icon", () => {
    const { container } = render(<ImagePlaceholder />);
    const svg = container.querySelector("svg");

    expect(svg).toBeDefined();
  });

  it("has overflow hidden", () => {
    const { container } = render(<ImagePlaceholder />);
    const placeholder = container.firstChild as HTMLElement;

    expect(placeholder.className).toContain("overflow-hidden");
  });

  it("has pulse animation", () => {
    const { container } = render(<ImagePlaceholder />);
    const animatedElement = container.querySelector(".animate-pulse");

    expect(animatedElement).toBeDefined();
  });

  it("is positioned relatively", () => {
    const { container } = render(<ImagePlaceholder />);
    const placeholder = container.firstChild as HTMLElement;

    expect(placeholder.className).toContain("relative");
  });

  it("has aria-hidden on SVG for accessibility", () => {
    const { container } = render(<ImagePlaceholder />);
    const svg = container.querySelector("svg");

    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });
});
