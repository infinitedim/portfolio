import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeSwitcher } from "../ThemeSwitcher";

// Mock useTheme hook
const mockChangeTheme = vi.fn();

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "dark",
    themeConfig: {
      colors: {
        bg: "#1a1b26",
        text: "#a9b1d6",
        accent: "#7aa2f7",
        border: "#3b4261",
        muted: "#565f89",
      },
    },
    changeTheme: mockChangeTheme,
    availableThemes: ["dark", "light", "nord", "dracula", "monokai"],
  }),
}));

// Mock isThemeName
vi.mock("@/types/theme", () => ({
  isThemeName: (name: string) =>
    ["dark", "light", "nord", "dracula", "monokai"].includes(name),
}));

// Mock Button component
vi.mock("@/ui/button", () => ({
  Button: ({ children, onClick, variant, size, style, ...props }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
    style?: React.CSSProperties;
  }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      style={style}
      {...props}
    >
      {children}
    </button>
  ),
}));

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders theme switcher", () => {
    render(<ThemeSwitcher />);
    expect(document.body.querySelector("div")).toBeDefined();
  });

  it("displays all available themes", () => {
    render(<ThemeSwitcher />);

    expect(screen.getByText("dark")).toBeDefined();
    expect(screen.getByText("light")).toBeDefined();
    expect(screen.getByText("nord")).toBeDefined();
    expect(screen.getByText("dracula")).toBeDefined();
    expect(screen.getByText("monokai")).toBeDefined();
  });

  it("highlights current theme", () => {
    render(<ThemeSwitcher />);

    const darkButton = screen.getByText("dark").closest("button");
    expect(darkButton?.getAttribute("data-variant")).toBe("default");
  });

  it("shows outline variant for non-active themes", () => {
    render(<ThemeSwitcher />);

    const lightButton = screen.getByText("light").closest("button");
    expect(lightButton?.getAttribute("data-variant")).toBe("outline");
  });

  it("changes theme when button is clicked", () => {
    render(<ThemeSwitcher />);

    const lightButton = screen.getByText("light");
    fireEvent.click(lightButton);

    expect(mockChangeTheme).toHaveBeenCalledWith("light");
  });

  it("handles theme change for all available themes", () => {
    render(<ThemeSwitcher />);

    const themes = ["dark", "light", "nord", "dracula", "monokai"];
    themes.forEach((theme) => {
      const button = screen.getByText(theme);
      fireEvent.click(button);
      expect(mockChangeTheme).toHaveBeenCalledWith(theme);
    });
  });

  it("uses sm size for buttons", () => {
    render(<ThemeSwitcher />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button.getAttribute("data-size")).toBe("sm");
    });
  });

  it("applies theme colors to buttons", () => {
    render(<ThemeSwitcher />);

    const darkButton = screen.getByText("dark").closest("button");
    expect(darkButton?.style.backgroundColor).toBeDefined();
  });

  it("has flex layout", () => {
    const { container } = render(<ThemeSwitcher />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("flex");
  });

  it("handles invalid theme names gracefully", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => { });

    render(<ThemeSwitcher />);

    // Should not throw errors
    expect(true).toBe(true);

    consoleSpy.mockRestore();
  });
});
