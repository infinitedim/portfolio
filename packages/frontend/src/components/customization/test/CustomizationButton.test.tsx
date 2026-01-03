import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CustomizationButton } from "../CustomizationButton";

// Mock useTheme hook
const mockThemeConfig = {
  colors: {
    bg: "#1a1b26",
    text: "#a9b1d6",
    accent: "#7aa2f7",
    border: "#3b4261",
    muted: "#565f89",
    success: "#9ece6a",
    error: "#f7768e",
    prompt: "#bb9af7",
  },
};

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "dark",
    themeConfig: mockThemeConfig,
    changeTheme: vi.fn(),
  }),
}));

// Mock CustomizationManager to avoid deep rendering
vi.mock("../CustomizationManager", () => ({
  CustomizationManager: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="customization-manager">
        <button onClick={onClose} data-testid="close-manager">
          Close
        </button>
      </div>
    ) : null,
}));

describe("CustomizationButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the customization button", () => {
    render(<CustomizationButton />);

    const button = screen.getByRole("button", {
      name: /open customization manager/i,
    });
    expect(button).toBeDefined();
  });

  it("has correct aria-label for accessibility", () => {
    render(<CustomizationButton />);

    const button = screen.getByLabelText("Open customization manager");
    expect(button).toBeDefined();
  });

  it("has correct title attribute", () => {
    render(<CustomizationButton />);

    const button = screen.getByTitle("Customize themes and fonts");
    expect(button).toBeDefined();
  });

  it("displays emoji icon", () => {
    render(<CustomizationButton />);

    expect(screen.getByText("🎨")).toBeDefined();
  });

  it("opens CustomizationManager when clicked", () => {
    render(<CustomizationButton />);

    // Manager should not be visible initially
    expect(screen.queryByTestId("customization-manager")).toBeNull();

    // Click the button
    const button = screen.getByRole("button", {
      name: /open customization manager/i,
    });
    fireEvent.click(button);

    // Manager should now be visible
    expect(screen.getByTestId("customization-manager")).toBeDefined();
  });

  it("closes CustomizationManager when onClose is called", () => {
    render(<CustomizationButton />);

    // Open the manager
    const button = screen.getByRole("button", {
      name: /open customization manager/i,
    });
    fireEvent.click(button);
    expect(screen.getByTestId("customization-manager")).toBeDefined();

    // Close the manager
    const closeButton = screen.getByTestId("close-manager");
    fireEvent.click(closeButton);

    // Manager should be closed
    expect(screen.queryByTestId("customization-manager")).toBeNull();
  });

  it("applies theme colors to button styles", () => {
    render(<CustomizationButton />);

    const button = screen.getByRole("button", {
      name: /open customization manager/i,
    });

    // Check that styles are applied (inline styles - browser may convert to RGB)
    expect(button.style.borderColor).toBeDefined();
    expect(button.style.color).toBeDefined();
    // Verify color is set (may be hex or rgb format)
    expect(button.style.borderColor.length).toBeGreaterThan(0);
    expect(button.style.color.length).toBeGreaterThan(0);
  });

  it("has fixed positioning class", () => {
    render(<CustomizationButton />);

    const button = screen.getByRole("button", {
      name: /open customization manager/i,
    });

    expect(button.className).toContain("fixed");
  });

  it("has z-index class for proper layering", () => {
    render(<CustomizationButton />);

    const button = screen.getByRole("button", {
      name: /open customization manager/i,
    });

    expect(button.className).toContain("z-40");
  });

  it("button has hover and transition classes", () => {
    render(<CustomizationButton />);

    const button = screen.getByRole("button", {
      name: /open customization manager/i,
    });

    expect(button.className).toContain("transition-all");
    expect(button.className).toContain("hover:scale-110");
  });
});
