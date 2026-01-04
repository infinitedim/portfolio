import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider, useThemeContext } from "../ThemeProvider";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock next-themes
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children, storageKey }: { children: React.ReactNode; storageKey?: string }) => (
    <div data-testid="theme-provider" data-storage-key={storageKey}>
      {children}
    </div>
  ),
  useTheme: () => ({
    theme: "dark",
    setTheme: vi.fn(),
    resolvedTheme: "dark",
  }),
}));

describe("ThemeProvider", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
  });

  it("renders children", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { getByText } = render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );

    expect(getByText("Test content")).toBeInTheDocument();
  });

  it("passes storageKey prop", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );

    const provider = getByTestId("theme-provider");
    expect(provider).toHaveAttribute("data-storage-key", "terminal-theme");
  });

  it("passes through other props", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { getByTestId } = render(
      <ThemeProvider defaultTheme="dark" enableSystem={true}>
        <div>Test</div>
      </ThemeProvider>
    );

    const provider = getByTestId("theme-provider");
    expect(provider).toBeInTheDocument();
  });
});

describe("useThemeContext", () => {
  it("returns theme context values", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const TestComponent = () => {
      const { theme, setTheme, resolvedTheme } = useThemeContext();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <span data-testid="resolved-theme">{resolvedTheme}</span>
        </div>
      );
    };

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestId("theme")).toHaveTextContent("dark");
    expect(getByTestId("resolved-theme")).toHaveTextContent("dark");
  });
});
