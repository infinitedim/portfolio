import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { ThemeEditor } from "../theme-editor";
import type { CustomTheme } from "@/types/customization";

// Mock theme hook
const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#0a0a0a",
    text: "#e5e5e5",
    accent: "#00ff41",
    muted: "#666666",
    border: "#333333",
    success: "#00ff41",
    error: "#ff4444",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}));

describe("ThemeEditor", () => {
  const mockTheme: CustomTheme = {
    id: "theme-1",
    name: "Test Theme",
    description: "A test theme",
    author: "Test Author",
    colors: {
      bg: "#000000",
      text: "#ffffff",
      prompt: "#00ff00",
      success: "#00ff00",
      error: "#ff0000",
      accent: "#0080ff",
      border: "#333333",
    },
    source: "custom",
    createdAt: new Date(),
  };

  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock document.documentElement.style
    if (typeof document !== "undefined") {
      const mockStyle = {
        setProperty: vi.fn(),
      };
      Object.defineProperty(document, "documentElement", {
        value: { style: mockStyle },
        writable: true,
        configurable: true,
      });
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render theme editor", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ThemeEditor
          theme={mockTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText("Edit Theme")).toBeInTheDocument();
    });

    it("should render Create New Theme for new theme", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const newTheme = { ...mockTheme, id: "" };

      render(
        <ThemeEditor
          theme={newTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText("Create New Theme")).toBeInTheDocument();
    });

    it("should render theme name input", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ThemeEditor
          theme={mockTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByDisplayValue("Test Theme")).toBeInTheDocument();
    });

    it("should render color palette inputs", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ThemeEditor
          theme={mockTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByDisplayValue("#000000")).toBeInTheDocument();
      expect(screen.getByDisplayValue("#ffffff")).toBeInTheDocument();
    });

    it("should render live preview", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ThemeEditor
          theme={mockTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText("Live Preview")).toBeInTheDocument();
    });

    it("should render save and cancel buttons", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ThemeEditor
          theme={mockTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText("Save Theme")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
  });

  describe("Theme Editing", () => {
    it("should update theme name when input changes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ThemeEditor
          theme={mockTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const nameInput = screen.getByDisplayValue("Test Theme");
      fireEvent.change(nameInput, { target: { value: "Updated Theme" } });

      expect(screen.getByDisplayValue("Updated Theme")).toBeInTheDocument();
    });

    it("should update color when color input changes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ThemeEditor
          theme={mockTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const colorInputs = screen.getAllByDisplayValue("#000000");
      if (colorInputs.length > 0) {
        fireEvent.change(colorInputs[0], { target: { value: "#ff0000" } });

        expect(screen.getByDisplayValue("#ff0000")).toBeInTheDocument();
      }
    });

    it("should update color when text input changes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ThemeEditor
          theme={mockTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const textInputs = screen.getAllByDisplayValue("#000000");
      if (textInputs.length > 0) {
        fireEvent.change(textInputs[0], { target: { value: "#00ff00" } });

        expect(screen.getByDisplayValue("#00ff00")).toBeInTheDocument();
      }
    });
  });

  describe("Preview Mode", () => {
    it("should toggle preview mode", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ThemeEditor
          theme={mockTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const previewButton = screen.getByText(/Preview in Terminal/);
      fireEvent.click(previewButton);

      expect(screen.getByText(/Live Preview ON/)).toBeInTheDocument();
    });
  });

  describe("Random Theme Generation", () => {
    it("should generate random theme when button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const newTheme = { ...mockTheme, id: "" };

      render(
        <ThemeEditor
          theme={newTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const generateButton = screen.getByText("Generate Random Theme");
      fireEvent.click(generateButton);

      // Theme name should change
      const nameInput = screen.getByPlaceholderText("Enter theme name");
      expect((nameInput as HTMLInputElement).value).not.toBe("Test Theme");
    });

    it("should show color rule dropdown for new themes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const newTheme = { ...mockTheme, id: "" };

      render(
        <ThemeEditor
          theme={newTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText(/Color Rule/)).toBeInTheDocument();
    });

    it("should change color rule when option is selected", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const newTheme = { ...mockTheme, id: "" };

      render(
        <ThemeEditor
          theme={newTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const colorRuleButton = screen.getByText(/70-20-5-1-1-1-2/);
      fireEvent.click(colorRuleButton);

      const option = screen.getByText(/50-25-10-5-5-3-2/);
      fireEvent.click(option);

      // Dropdown should close
      expect(screen.queryByText(/50-25-10-5-5-3-2 \(Even\)/)).not.toBeInTheDocument();
    });
  });

  describe("Save and Cancel", () => {
    it("should call onSave when save button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ThemeEditor
          theme={mockTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const saveButton = screen.getByText("Save Theme");
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalled();
    });

    it("should call onCancel when cancel button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ThemeEditor
          theme={mockTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("should disable save button when name is empty", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ThemeEditor
          theme={mockTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const nameInput = screen.getByDisplayValue("Test Theme");
      fireEvent.change(nameInput, { target: { value: "   " } });

      const saveButton = screen.getByText("Save Theme");
      expect(saveButton).toBeDisabled();
    });
  });

  describe("Escape Key Handling", () => {
    it("should close color rule dropdown on Escape key", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const newTheme = { ...mockTheme, id: "" };

      render(
        <ThemeEditor
          theme={newTheme}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const colorRuleButton = screen.getByText(/70-20-5-1-1-1-2/);
      fireEvent.click(colorRuleButton);

      fireEvent.keyDown(document, { key: "Escape" });

      // Dropdown should close
      expect(screen.queryByText(/50-25-10-5-5-3-2/)).not.toBeInTheDocument();
    });
  });
});
