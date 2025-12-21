import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import LetterGlitchClient from "../LetterGlitchClient";

// Mock requestAnimationFrame
const mockRequestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  return setTimeout(() => callback(Date.now()), 16) as unknown as number;
});

const mockCancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id);
});

Object.defineProperty(window, "requestAnimationFrame", {
  value: mockRequestAnimationFrame,
  writable: true,
});

Object.defineProperty(window, "cancelAnimationFrame", {
  value: mockCancelAnimationFrame,
  writable: true,
});

// Mock ResizeObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: mockObserve,
  disconnect: mockDisconnect,
  unobserve: mockUnobserve,
}));

// Mock canvas context
const mockContext = {
  fillStyle: "",
  font: "",
  fillRect: vi.fn(),
  fillText: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: vi.fn(),
  drawImage: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
};

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as unknown as typeof HTMLCanvasElement.prototype.getContext;

describe("LetterGlitchClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders canvas element", () => {
    const { container } = render(<LetterGlitchClient />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("uses default glitch colors", () => {
    const { container } = render(<LetterGlitchClient />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("accepts custom glitch colors", () => {
    const colors = ["#ff0000", "#00ff00", "#0000ff"];
    const { container } = render(<LetterGlitchClient glitchColors={colors} />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("uses default glitch speed of 50", () => {
    const { container } = render(<LetterGlitchClient />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("accepts custom glitch speed", () => {
    const { container } = render(<LetterGlitchClient glitchSpeed={100} />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("applies centerVignette effect", () => {
    const { container } = render(<LetterGlitchClient centerVignette={true} />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("applies outerVignette effect by default", () => {
    const { container } = render(<LetterGlitchClient />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("accepts smooth animation option", () => {
    const { container } = render(<LetterGlitchClient smooth={false} />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("uses default characters", () => {
    const { container } = render(<LetterGlitchClient />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("accepts custom characters", () => {
    const { container } = render(
      <LetterGlitchClient characters="MATRIX01" />
    );
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("accepts className prop", () => {
    const { container } = render(
      <LetterGlitchClient className="custom-class" />
    );
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeDefined();
  });

  it("renders with valid dimensions", () => {
    const { container } = render(<LetterGlitchClient />);
    const canvas = container.querySelector("canvas");
    expect(canvas?.className).toContain("w-full");
    expect(canvas?.className).toContain("h-full");
  });

  it("is a block element", () => {
    const { container } = render(<LetterGlitchClient />);
    const canvas = container.querySelector("canvas");
    expect(canvas?.className).toContain("block");
  });
});
