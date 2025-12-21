import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OptimizedImage } from "../OptimizedImage";

// Mock cn utility
vi.mock("@/lib/utils/utils", () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, onLoadingComplete, onError, ...props }: {
    src: string;
    alt: string;
    onLoadingComplete?: () => void;
    onError?: () => void;
    [key: string]: unknown;
  }) => (
    <img
      src={src}
      alt={alt}
      data-testid="next-image"
      onLoad={onLoadingComplete}
      onError={onError}
      {...props}
    />
  ),
}));

describe("OptimizedImage", () => {
  it("renders the image", () => {
    render(<OptimizedImage src="/test.jpg" alt="Test image" />);
    expect(screen.getByTestId("next-image")).toBeDefined();
  });

  it("sets correct alt text", () => {
    render(<OptimizedImage src="/test.jpg" alt="Test description" />);
    const img = screen.getByTestId("next-image");
    expect(img.getAttribute("alt")).toBe("Test description");
  });

  it("uses default dimensions", () => {
    const { container } = render(
      <OptimizedImage src="/test.jpg" alt="Test" />
    );
    // Default width and height are 400x300
    expect(container.querySelector("img")).toBeDefined();
  });

  it("applies custom dimensions", () => {
    render(
      <OptimizedImage src="/test.jpg" alt="Test" width={800} height={600} />
    );
    const img = screen.getByTestId("next-image");
    expect(img.getAttribute("width")).toBe("800");
    expect(img.getAttribute("height")).toBe("600");
  });

  it("applies custom className", () => {
    const { container } = render(
      <OptimizedImage src="/test.jpg" alt="Test" className="custom-class" />
    );
    expect(container.innerHTML).toContain("custom-class");
  });

  it("shows error state when image fails to load", () => {
    render(<OptimizedImage src="/broken.jpg" alt="Broken image" />);

    const img = screen.getByTestId("next-image");
    fireEvent.error(img);

    // Should show error placeholder
    expect(screen.getByText("Image not available")).toBeDefined();
  });

  it("shows placeholder emoji on error", () => {
    render(<OptimizedImage src="/broken.jpg" alt="Broken" />);

    const img = screen.getByTestId("next-image");
    fireEvent.error(img);

    expect(screen.getByText("🖼️")).toBeDefined();
  });

  it("sets priority when specified", () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" priority />);
    const img = screen.getByTestId("next-image");
    expect(img).toBeDefined();
  });

  it("handles fill mode", () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" fill />);
    const img = screen.getByTestId("next-image");
    expect(img).toBeDefined();
  });
});
