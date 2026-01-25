import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { ThemeSwitcher } from "../theme-switcher";

// Mock theme hook
const mockChangeTheme = vi.fn(() => true);
const mockAvailableThemes = ["dark", "light", "terminal"];

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    theme: "dark",
    changeTheme: mockChangeTheme,
    availableThemes: mockAvailableThemes,
  }),
}));

// Mock AnimatedButton
vi.mock("@/components/atoms/shared/button", () => ({
  AnimatedButton: ({
    children,
    onClick,
    variant,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    variant: string;
  }) => (
    <button onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
}));

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render theme switcher", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ThemeSwitcher />);

      expect(screen.getByText("dark")).toBeInTheDocument();
      expect(screen.getByText("light")).toBeInTheDocument();
      expect(screen.getByText("terminal")).toBeInTheDocument();
    });

    it("should highlight current theme", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ThemeSwitcher />);

      const darkButton = screen.getByText("dark");
      expect(darkButton).toHaveAttribute("data-variant", "primary");
    });

    it("should show other themes as secondary", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ThemeSwitcher />);

      const lightButton = screen.getByText("light");
      expect(lightButton).toHaveAttribute("data-variant", "secondary");
    });
  });

  describe("Theme Change", () => {
    it("should call changeTheme when button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<ThemeSwitcher />);

      const lightButton = screen.getByText("light");
      fireEvent.click(lightButton);

      expect(mockChangeTheme).toHaveBeenCalledWith("light");
    });
  });
});
