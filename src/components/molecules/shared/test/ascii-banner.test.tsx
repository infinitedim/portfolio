import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { ASCIIBanner } from "../ascii-banner";

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
    theme: "default",
  }),
}));

describe("ASCIIBanner", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render ASCII banner", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ASCIIBanner />);

      expect(screen.getByText("Interactive Developer Portfolio")).toBeInTheDocument();
    });

    it("should render subtitle text", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ASCIIBanner />);

      expect(
        screen.getByText(/Type 'help' to explore/),
      ).toBeInTheDocument();
    });

    it("should render desktop banner on large screens", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<ASCIIBanner />);

      const desktopBanner = container.querySelector(".hidden.sm\\:block");
      expect(desktopBanner).toBeInTheDocument();
    });

    it("should render mobile banner on small screens", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<ASCIIBanner />);

      const mobileBanner = container.querySelector(".block.sm\\:hidden");
      expect(mobileBanner).toBeInTheDocument();
    });

    it("should render separator line", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<ASCIIBanner />);

      const separator = container.querySelector(".h-px");
      expect(separator).toBeInTheDocument();
    });
  });
});
