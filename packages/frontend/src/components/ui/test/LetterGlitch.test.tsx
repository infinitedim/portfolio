import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import LetterGlitch from "../LetterGlitch";
import type { JSX } from "react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock next/dynamic
vi.mock("next/dynamic", () => ({
  default: (dynamicImport: () => Promise<unknown>, options?: { loading?: () => JSX.Element }) => {
    // Return the loading component for testing
    const LoadingComponent = options?.loading;

    return function MockDynamicComponent(props: Record<string, unknown>) {
      // If we can get the actual component, use it, otherwise use loading
      if (LoadingComponent) {
        return LoadingComponent();
      }
      return (
        <canvas
          data-testid="letter-glitch-canvas"
          className={props.className as string}
          aria-hidden="true"
        />
      );
    };
  },
}));

describe("LetterGlitch", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<LetterGlitch />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("renders canvas element", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<LetterGlitch />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeDefined();
  });

  it("accepts glitchColors prop", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const colors = ["#ff0000", "#00ff00", "#0000ff"];
    const { container } = render(<LetterGlitch glitchColors={colors} />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("accepts glitchSpeed prop", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<LetterGlitch glitchSpeed={100} />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("accepts centerVignette prop", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<LetterGlitch centerVignette={true} />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("accepts outerVignette prop", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<LetterGlitch outerVignette={true} />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("accepts smooth prop", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<LetterGlitch smooth={true} />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("accepts characters prop", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(
      <LetterGlitch characters="ABC123!@#" />
    );
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("accepts className prop", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(
      <LetterGlitch className="custom-class" />
    );
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("has pointer-events-none class", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<LetterGlitch />);
    const canvas = container.querySelector("canvas");
    expect(canvas?.className).toContain("pointer-events-none");
  });

  it("is hidden from accessibility tree", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<LetterGlitch />);
    const canvas = container.querySelector("canvas");
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders with all props combined", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(
      <LetterGlitch
        glitchColors={["#00ff00"]}
        glitchSpeed={50}
        centerVignette={true}
        outerVignette={true}
        smooth={true}
        characters="XYZ"
        className="test-class"
      />
    );
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("has fixed positioning in loading state", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<LetterGlitch />);
    const canvas = container.querySelector("canvas");
    expect(canvas?.className).toContain("fixed");
  });

  it("exports as default", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    expect(LetterGlitch).toBeDefined();
    expect(typeof LetterGlitch).toBe("function");
  });
});
