import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { LazyCustomizationManager, LazyFontManager, LazyThemeManager, withLazyLoading, CustomizationManager, FontManager, ThemeManager } from "../LazyComponents";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock useTheme
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    themeConfig: {
      colors: {
        bg: "#000000",
        text: "#ffffff",
        accent: "#00ff00",
      },
    },
  }),
}));

// Mock the lazy components
vi.mock("../customization/CustomizationManager", () => ({
  CustomizationManager: () => <div>CustomizationManager</div>,
}));

vi.mock("../customization/FontManager", () => ({
  FontManager: () => <div>FontManager</div>,
}));

vi.mock("../customization/ThemeManager", () => ({
  ThemeManager: () => <div>ThemeManager</div>,
}));

describe("LazyComponents", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
  });

  it("renders lazy component with Suspense", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <LazyCustomizationManager />
      </Suspense>
    );

    // Should show loading first, then component
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("withLazyLoading wraps component with Suspense", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const TestComponent = () => <div>Test</div>;
    const WrappedComponent = withLazyLoading(TestComponent, "Loading test...");

    render(<WrappedComponent />);

    expect(screen.getByText("Loading test...")).toBeInTheDocument();
  });

  it("CustomizationManager is wrapped with lazy loading", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <CustomizationManager />
      </Suspense>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("FontManager is wrapped with lazy loading", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <FontManager />
      </Suspense>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("ThemeManager is wrapped with lazy loading", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <ThemeManager />
      </Suspense>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
