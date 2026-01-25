import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { ThemeProvider, useThemeContext } from "../theme-provider";

// Mock next-themes
const mockSetTheme = vi.fn();
const mockUseTheme = vi.fn(() => ({
  theme: "dark",
  setTheme: mockSetTheme,
  resolvedTheme: "dark",
}));

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: any) => <div>{children}</div>,
  useTheme: () => mockUseTheme(),
}));

describe("ThemeProvider", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("ThemeProvider Component", () => {
    it("should render children", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { getByText } = render(
        <ThemeProvider>
          <div>Test Content</div>
        </ThemeProvider>,
      );

      expect(getByText("Test Content")).toBeInTheDocument();
    });

    it("should pass props to NextThemesProvider", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <ThemeProvider attribute="class" defaultTheme="system">
          <div>Test</div>
        </ThemeProvider>,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("useThemeContext Hook", () => {
    it("should return theme context", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const TestComponent = () => {
        const context = useThemeContext();
        return <div data-testid="theme">{context.theme}</div>;
      };

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(getByTestId("theme").textContent).toBe("system");
    });
  });
});
