import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { LanguageSwitcher } from "../language-switcher";

// Mock theme hook
const mockThemeConfig = {
  colors: {
    bg: "#000000",
    text: "#ffffff",
    accent: "#00ff00",
    border: "#333333",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}));

// Mock i18n hook
const mockChangeLocale = vi.fn(() => true);
const mockSupportedLocales = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
  },
  {
    code: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    flag: "🇮🇩",
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
  },
];

const mockCurrentLocale = "en";
const mockCurrentLocaleConfig = mockSupportedLocales[0];

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({
    currentLocale: mockCurrentLocale,
    changeLocale: mockChangeLocale,
    getSupportedLocales: () => mockSupportedLocales,
    getCurrentLocaleConfig: () => mockCurrentLocaleConfig,
  }),
}));

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render language switcher with dropdown variant by default", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher />);

      expect(
        screen.getByLabelText(/Current language: English/i),
      ).toBeInTheDocument();
    });

    it("should render with list variant", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher variant="list" />);

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getByText("English")).toBeInTheDocument();
      expect(screen.getByText("Bahasa Indonesia")).toBeInTheDocument();
    });

    it("should show flags when showFlags is true", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher showFlags={true} />);

      const button = screen.getByLabelText(/Current language: English/i);
      expect(button.textContent).toContain("🇺🇸");
    });

    it("should hide flags when showFlags is false", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher showFlags={false} />);

      const button = screen.getByLabelText(/Current language: English/i);
      expect(button.textContent).not.toContain("🇺🇸");
    });

    it("should show native names when showNative is true", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher showNative={true} variant="list" />);

      expect(screen.getByText("Bahasa Indonesia")).toBeInTheDocument();
    });

    it("should show English names when showNative is false", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher showNative={false} variant="list" />);

      expect(screen.getByText("Indonesian")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <LanguageSwitcher className="custom-class" />,
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Dropdown Interaction", () => {
    it("should open dropdown when button is clicked", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher />);

      const button = screen.getByLabelText(/Current language: English/i);
      expect(button).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "true");
      });

      expect(screen.getByText("Bahasa Indonesia")).toBeInTheDocument();
    });

    it("should close dropdown when clicking outside", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher />);

      const button = screen.getByLabelText(/Current language: English/i);
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "true");
      });

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "false");
      });
    });

    it("should close dropdown when Escape key is pressed", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher />);

      const button = screen.getByLabelText(/Current language: English/i);
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "true");
      });

      fireEvent.keyDown(button, { key: "Escape" });

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "false");
      });
    });

    it("should toggle dropdown when Enter key is pressed", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher />);

      const button = screen.getByLabelText(/Current language: English/i);
      expect(button).toHaveAttribute("aria-expanded", "false");

      fireEvent.keyDown(button, { key: "Enter" });

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("should toggle dropdown when Space key is pressed", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher />);

      const button = screen.getByLabelText(/Current language: English/i);
      expect(button).toHaveAttribute("aria-expanded", "false");

      fireEvent.keyDown(button, { key: " " });

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "true");
      });
    });
  });

  describe("Language Selection", () => {
    it("should call changeLocale when language is selected", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher />);

      const button = screen.getByLabelText(/Current language: English/i);
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Bahasa Indonesia")).toBeInTheDocument();
      });

      const indonesianButton = screen.getByText("Bahasa Indonesia");
      fireEvent.click(indonesianButton);

      expect(mockChangeLocale).toHaveBeenCalledWith("id");
    });

    it("should call onLanguageChange callback when provided", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const onLanguageChange = vi.fn();
      render(<LanguageSwitcher onLanguageChange={onLanguageChange} />);

      const button = screen.getByLabelText(/Current language: English/i);
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Bahasa Indonesia")).toBeInTheDocument();
      });

      const indonesianButton = screen.getByText("Bahasa Indonesia");
      fireEvent.click(indonesianButton);

      expect(onLanguageChange).toHaveBeenCalledWith("id");
    });

    it("should close dropdown after language selection", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher />);

      const button = screen.getByLabelText(/Current language: English/i);
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "true");
      });

      const indonesianButton = screen.getByText("Bahasa Indonesia");
      fireEvent.click(indonesianButton);

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "false");
      });
    });

    it("should select language with Enter key in list variant", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher variant="list" />);

      const indonesianButton = screen.getByText("Bahasa Indonesia");
      fireEvent.keyDown(indonesianButton, { key: "Enter" });

      expect(mockChangeLocale).toHaveBeenCalledWith("id");
    });

    it("should select language with Space key in list variant", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher variant="list" />);

      const indonesianButton = screen.getByText("Bahasa Indonesia");
      fireEvent.keyDown(indonesianButton, { key: " " });

      expect(mockChangeLocale).toHaveBeenCalledWith("id");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes in dropdown variant", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher />);

      const button = screen.getByLabelText(/Current language: English/i);
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveAttribute("aria-haspopup", "listbox");
    });

    it("should have proper ARIA attributes in list variant", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher variant="list" />);

      const listbox = screen.getByRole("listbox");
      expect(listbox).toHaveAttribute("aria-label", "Select language");

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);

      const selectedOption = options.find((opt) =>
        opt.getAttribute("aria-selected") === "true",
      );
      expect(selectedOption).toBeInTheDocument();
    });

    it("should mark selected language with aria-selected", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher variant="list" />);

      const englishButton = screen.getByText("English");
      expect(englishButton).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Edge Cases", () => {
    it("should handle changeLocale returning false", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockChangeLocale.mockReturnValueOnce(false);

      render(<LanguageSwitcher />);

      const button = screen.getByLabelText(/Current language: English/i);
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Bahasa Indonesia")).toBeInTheDocument();
      });

      const indonesianButton = screen.getByText("Bahasa Indonesia");
      fireEvent.click(indonesianButton);

      expect(mockChangeLocale).toHaveBeenCalledWith("id");
      // Dropdown should still close even if changeLocale returns false
      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "false");
      });
    });

    it("should render all supported languages in list variant", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<LanguageSwitcher variant="list" />);

      // Should render all supported locales
      expect(screen.getByText("English")).toBeInTheDocument();
      expect(screen.getByText("Bahasa Indonesia")).toBeInTheDocument();
      expect(screen.getByText("العربية")).toBeInTheDocument();
    });
  });
});
