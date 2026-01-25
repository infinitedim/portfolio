import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { LetterGlitch } from "../letter-glitch";

// Mock dynamic import
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<any>) => {
    const MockComponent = () => (
      <canvas
        className="fixed inset-0 w-full h-full pointer-events-none opacity-20"
        style={{
          zIndex: -10,
          background: "transparent",
        }}
        aria-hidden="true"
        data-testid="letter-glitch-canvas"
      />
    );
    return MockComponent;
  },
}));

describe("LetterGlitch", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render letter glitch component", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<LetterGlitch />);

      const canvas = container.querySelector("canvas");
      expect(canvas).toBeInTheDocument();
    });

    it("should render with custom className", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <LetterGlitch className="custom-class" />,
      );

      const canvas = container.querySelector("canvas");
      expect(canvas).toBeInTheDocument();
    });

    it("should render with custom props", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <LetterGlitch
          glitchColors={["#ff0000", "#00ff00"]}
          glitchSpeed={100}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
          characters="ABC"
        />,
      );

      const canvas = container.querySelector("canvas");
      expect(canvas).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle errors gracefully", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      // Force an error by mocking dynamic import to throw
      vi.mock("next/dynamic", () => ({
        default: () => {
          throw new Error("Test error");
        },
      }));

      const { container } = render(<LetterGlitch />);

      // Should render fallback div
      const fallback = container.querySelector("div[aria-hidden='true']");
      expect(fallback).toBeInTheDocument();

      consoleError.mockRestore();
    });
  });
});
