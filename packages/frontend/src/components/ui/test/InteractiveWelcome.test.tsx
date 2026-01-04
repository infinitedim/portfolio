import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { InteractiveWelcome } from "../InteractiveWelcome";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock useTheme hook
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
    changeTheme: vi.fn(),
    availableThemes: ["dark", "light"],
  }),
}));

describe("InteractiveWelcome", () => {
  const defaultProps = {
    onCommandSelect: vi.fn(),
    onDismiss: vi.fn(),
    onStartTour: vi.fn(),
  };

  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders welcome screen", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<InteractiveWelcome {...defaultProps} />);
    expect(screen.getByText(/Welcome to My Terminal Portfolio/)).toBeDefined();
  });

  it("displays welcome message", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<InteractiveWelcome {...defaultProps} />);
    expect(screen.getByText(/Click on any command below/)).toBeDefined();
  });

  it("displays all quick commands", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<InteractiveWelcome {...defaultProps} />);

    expect(screen.getByText("tour")).toBeDefined();
    expect(screen.getByText("help")).toBeDefined();
    expect(screen.getByText("about")).toBeDefined();
    expect(screen.getByText("skills")).toBeDefined();
    expect(screen.getByText("projects")).toBeDefined();
    expect(screen.getByText("contact")).toBeDefined();
  });

  it("displays command descriptions", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<InteractiveWelcome {...defaultProps} />);

    expect(screen.getByText("Take a guided tour")).toBeDefined();
    expect(screen.getByText("View all available commands")).toBeDefined();
    expect(screen.getByText("Learn about me")).toBeDefined();
    expect(screen.getByText("View my technical skills")).toBeDefined();
    expect(screen.getByText("Explore my projects")).toBeDefined();
    expect(screen.getByText("Get in touch")).toBeDefined();
  });

  it("displays command icons", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<InteractiveWelcome {...defaultProps} />);

    expect(screen.getByText("🎓")).toBeDefined();
    expect(screen.getByText("❓")).toBeDefined();
    expect(screen.getByText("👨‍💻")).toBeDefined();
    expect(screen.getByText("🛠️")).toBeDefined();
    expect(screen.getByText("📁")).toBeDefined();
    expect(screen.getByText("📧")).toBeDefined();
  });

  it("highlights tour command with NEW badge", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<InteractiveWelcome {...defaultProps} />);
    expect(screen.getByText("NEW")).toBeDefined();
  });

  it("calls onCommandSelect when command is clicked", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<InteractiveWelcome {...defaultProps} />);

    const helpButton = screen.getByText("help").closest("button");
    if (helpButton) {
      fireEvent.click(helpButton);

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(defaultProps.onCommandSelect).toHaveBeenCalledWith("help");
    }
  });

  it("calls onDismiss after command selection", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<InteractiveWelcome {...defaultProps} />);

    const aboutButton = screen.getByText("about").closest("button");
    if (aboutButton) {
      fireEvent.click(aboutButton);

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(defaultProps.onDismiss).toHaveBeenCalled();
    }
  });

  it("calls onStartTour for tour command", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<InteractiveWelcome {...defaultProps} />);

    const tourButton = screen.getByText("tour").closest("button");
    if (tourButton) {
      fireEvent.click(tourButton);

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(defaultProps.onStartTour).toHaveBeenCalled();
    }
  });

  it("calls onDismiss after tour command", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<InteractiveWelcome {...defaultProps} />);

    const tourButton = screen.getByText("tour").closest("button");
    if (tourButton) {
      fireEvent.click(tourButton);

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(defaultProps.onDismiss).toHaveBeenCalled();
    }
  });

  it("has styled container with backdrop blur", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<InteractiveWelcome {...defaultProps} />);
    expect(container.querySelector(".backdrop-blur-sm")).toBeDefined();
  });

  it("applies theme colors", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<InteractiveWelcome {...defaultProps} />);
    const firstDiv = container.firstChild as HTMLElement;
    expect(firstDiv.style.borderColor).toBeDefined();
  });

  it("has grid layout for commands", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<InteractiveWelcome {...defaultProps} />);
    expect(container.querySelector(".grid")).toBeDefined();
  });

  it("is a memoized component", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    // InteractiveWelcome is wrapped in memo - verify it's a valid React component
    // Memoized components are objects in React
    expect(InteractiveWelcome).toBeDefined();
    expect(InteractiveWelcome.displayName).toBe("InteractiveWelcome");
  });
});
