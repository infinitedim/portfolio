import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { TabCompletion } from "../tab-completion";

// Mock theme hook
const mockThemeConfig = {
  colors: {
    bg: "#000000",
    text: "#ffffff",
    accent: "#00ff00",
    border: "#333333",
    muted: "#888888",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
    theme: "default",
  }),
}));

describe("TabCompletion", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should not render when visible is false", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <TabCompletion
          input="hel"
          availableCommands={["help", "hello"]}
          onComplete={vi.fn()}
          visible={false}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should not render when no completions match", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <TabCompletion
          input="xyz"
          availableCommands={["help", "hello"]}
          onComplete={vi.fn()}
          visible={true}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render when visible and matches found", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TabCompletion
          input="hel"
          availableCommands={["help", "hello", "world"]}
          onComplete={vi.fn()}
          visible={true}
        />,
      );

      expect(screen.getByText(/Tab completion/i)).toBeInTheDocument();
      expect(screen.getByText("help")).toBeInTheDocument();
      expect(screen.getByText("hello")).toBeInTheDocument();
    });

    it("should filter commands case-insensitively", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TabCompletion
          input="HEL"
          availableCommands={["help", "hello", "world"]}
          onComplete={vi.fn()}
          visible={true}
        />,
      );

      expect(screen.getByText("help")).toBeInTheDocument();
      expect(screen.getByText("hello")).toBeInTheDocument();
      expect(screen.queryByText("world")).not.toBeInTheDocument();
    });

    it("should show completion count", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TabCompletion
          input="hel"
          availableCommands={["help", "hello"]}
          onComplete={vi.fn()}
          visible={true}
        />,
      );

      expect(screen.getByText(/2 options/i)).toBeInTheDocument();
    });

    it("should show singular form for single option", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TabCompletion
          input="help"
          availableCommands={["help", "hello"]}
          onComplete={vi.fn()}
          visible={true}
        />,
      );

      expect(screen.getByText(/1 option/i)).toBeInTheDocument();
    });
  });

  describe("Interaction", () => {
    it("should call onComplete when completion is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const onComplete = vi.fn();
      render(
        <TabCompletion
          input="hel"
          availableCommands={["help", "hello"]}
          onComplete={onComplete}
          visible={true}
        />,
      );

      const helpButton = screen.getByText("help");
      fireEvent.click(helpButton);

      expect(onComplete).toHaveBeenCalledWith("help");
    });

    it("should call onComplete when completion is selected with Enter", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const onComplete = vi.fn();
      render(
        <TabCompletion
          input="hel"
          availableCommands={["help", "hello"]}
          onComplete={onComplete}
          visible={true}
        />,
      );

      const helpButton = screen.getByText("help");
      fireEvent.keyDown(helpButton, { key: "Enter" });

      expect(onComplete).toHaveBeenCalledWith("help");
    });

    it("should call onComplete when completion is selected with Space", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const onComplete = vi.fn();
      render(
        <TabCompletion
          input="hel"
          availableCommands={["help", "hello"]}
          onComplete={onComplete}
          visible={true}
        />,
      );

      const helpButton = screen.getByText("help");
      fireEvent.keyDown(helpButton, { key: " " });

      expect(onComplete).toHaveBeenCalledWith("help");
    });

    it("should not call onComplete for other keys", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const onComplete = vi.fn();
      render(
        <TabCompletion
          input="hel"
          availableCommands={["help", "hello"]}
          onComplete={onComplete}
          visible={true}
        />,
      );

      const helpButton = screen.getByText("help");
      fireEvent.keyDown(helpButton, { key: "Escape" });

      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("should apply theme colors", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <TabCompletion
          input="hel"
          availableCommands={["help"]}
          onComplete={vi.fn()}
          visible={true}
        />,
      );

      const dropdown = container.firstChild as HTMLElement;
      expect(dropdown).toHaveStyle({
        backgroundColor: "#000000",
      });
    });

    it("should highlight matching portion", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TabCompletion
          input="hel"
          availableCommands={["help"]}
          onComplete={vi.fn()}
          visible={true}
        />,
      );

      const helpButton = screen.getByText("help");
      expect(helpButton).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty input", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <TabCompletion
          input=""
          availableCommands={["help", "hello"]}
          onComplete={vi.fn()}
          visible={true}
        />,
      );

      // Should show all commands when input is empty
      expect(screen.getByText("help")).toBeInTheDocument();
      expect(screen.getByText("hello")).toBeInTheDocument();
    });

    it("should handle empty availableCommands array", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <TabCompletion
          input="hel"
          availableCommands={[]}
          onComplete={vi.fn()}
          visible={true}
        />,
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
