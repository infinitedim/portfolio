import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageSwitcher } from "../LanguageSwitcher";

// Mock useTheme hook
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    themeConfig: {
      colors: {
        bg: "#000000",
        text: "#ffffff",
        accent: "#00ff00",
        border: "#333333",
        muted: "#666666",
      },
    },
  }),
}));

// Mock useI18n hook
const mockChangeLocale = vi.fn().mockReturnValue(true);
vi.mock("@/hooks/useI18n", () => ({
  useI18n: () => ({
    currentLocale: "en_US",
    changeLocale: mockChangeLocale,
    getSupportedLocales: () => [
      {
        code: "en_US",
        name: "English (US)",
        nativeName: "English (American)",
        flag: "🇺🇸",
        direction: "ltr",
      },
      {
        code: "id_ID",
        name: "Indonesian",
        nativeName: "Bahasa Indonesia",
        flag: "🇮🇩",
        direction: "ltr",
      },
      {
        code: "es_ES",
        name: "Spanish",
        nativeName: "Español",
        flag: "🇪🇸",
        direction: "ltr",
      },
    ],
    getCurrentLocaleConfig: () => ({
      code: "en_US",
      name: "English (US)",
      nativeName: "English (American)",
      flag: "🇺🇸",
      direction: "ltr",
    }),
  }),
}));

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("dropdown variant", () => {
    it("renders dropdown button with current language", () => {
      render(<LanguageSwitcher variant="dropdown" />);

      const button = screen.getByRole("button");
      expect(button).toBeDefined();
      expect(button.textContent).toContain("🇺🇸");
    });

    it("shows native language name when showNative is true", () => {
      render(
        <LanguageSwitcher
          variant="dropdown"
          showNative={true}
        />,
      );

      const button = screen.getByRole("button");
      expect(button.textContent).toContain("English (American)");
    });

    it("shows regular language name when showNative is false", () => {
      render(
        <LanguageSwitcher
          variant="dropdown"
          showNative={false}
        />,
      );

      const button = screen.getByRole("button");
      expect(button.textContent).toContain("English (US)");
    });

    it("hides flag when showFlags is false", () => {
      render(
        <LanguageSwitcher
          variant="dropdown"
          showFlags={false}
          showNative={false}
        />,
      );

      const button = screen.getByRole("button");
      expect(button.textContent).toContain("English (US)");
      expect(button.textContent).not.toContain("🇺🇸");
    });

    it("opens dropdown when clicked", () => {
      render(<LanguageSwitcher variant="dropdown" />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeDefined();
    });

    it("shows all supported languages in dropdown", () => {
      render(<LanguageSwitcher variant="dropdown" />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeDefined();

      // Check all languages are present
      const options = screen.getAllByRole("option");
      expect(options.length).toBe(3);

      const optionTexts = options.map((opt) => opt.textContent);
      expect(optionTexts.some((t) => t?.includes("English (American)"))).toBe(
        true,
      );
      expect(optionTexts.some((t) => t?.includes("Bahasa Indonesia"))).toBe(
        true,
      );
      expect(optionTexts.some((t) => t?.includes("Español"))).toBe(true);
    });

    it("calls changeLocale when a language is selected", () => {
      render(<LanguageSwitcher variant="dropdown" />);

      // Open dropdown
      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Select Indonesian (second option)
      const options = screen.getAllByRole("option");
      const indonesianOption = options.find((opt) =>
        opt.textContent?.includes("Bahasa Indonesia"),
      );
      expect(indonesianOption).toBeDefined();
      fireEvent.click(indonesianOption!);

      expect(mockChangeLocale).toHaveBeenCalledWith("id_ID");
    });

    it("calls onLanguageChange callback when language changes", () => {
      const onLanguageChange = vi.fn();
      render(
        <LanguageSwitcher
          variant="dropdown"
          onLanguageChange={onLanguageChange}
        />,
      );

      // Open dropdown
      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Select Spanish
      const options = screen.getAllByRole("option");
      const spanishOption = options.find((opt) =>
        opt.textContent?.includes("Español"),
      );
      expect(spanishOption).toBeDefined();
      fireEvent.click(spanishOption!);

      expect(onLanguageChange).toHaveBeenCalledWith("es_ES");
    });

    it("closes dropdown when clicking outside", () => {
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <LanguageSwitcher variant="dropdown" />
        </div>,
      );

      // Open dropdown
      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByRole("listbox")).toBeDefined();

      // Click outside
      fireEvent.mouseDown(screen.getByTestId("outside"));

      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("closes dropdown on Escape key", () => {
      render(<LanguageSwitcher variant="dropdown" />);

      // Open dropdown
      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByRole("listbox")).toBeDefined();

      // Press Escape
      fireEvent.keyDown(button, { key: "Escape" });

      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });

  describe("list variant", () => {
    it("renders all languages as buttons", () => {
      render(<LanguageSwitcher variant="list" />);

      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeDefined();

      const options = screen.getAllByRole("option");
      expect(options.length).toBe(3);
    });

    it("marks current language as selected", () => {
      render(<LanguageSwitcher variant="list" />);

      const options = screen.getAllByRole("option");
      const englishOption = options.find((opt) =>
        opt.textContent?.includes("English"),
      );
      expect(englishOption).toBeDefined();
      expect(englishOption?.getAttribute("aria-selected")).toBe("true");
    });

    it("calls changeLocale when a language button is clicked", () => {
      render(<LanguageSwitcher variant="list" />);

      const options = screen.getAllByRole("option");
      const indonesianOption = options.find((opt) =>
        opt.textContent?.includes("Bahasa Indonesia"),
      );
      expect(indonesianOption).toBeDefined();
      fireEvent.click(indonesianOption!);

      expect(mockChangeLocale).toHaveBeenCalledWith("id_ID");
    });
  });

  describe("accessibility", () => {
    it("has proper ARIA attributes on dropdown", () => {
      render(<LanguageSwitcher variant="dropdown" />);

      const button = screen.getByRole("button");
      expect(button.getAttribute("aria-expanded")).toBe("false");
      expect(button.getAttribute("aria-haspopup")).toBe("listbox");
    });

    it("updates aria-expanded when dropdown opens", () => {
      render(<LanguageSwitcher variant="dropdown" />);

      const button = screen.getByRole("button");
      expect(button.getAttribute("aria-expanded")).toBe("false");

      fireEvent.click(button);
      expect(button.getAttribute("aria-expanded")).toBe("true");
    });

    it("supports keyboard navigation with Enter key", () => {
      render(<LanguageSwitcher variant="dropdown" />);

      const button = screen.getByRole("button");

      // Open with Enter
      fireEvent.keyDown(button, { key: "Enter" });
      expect(screen.getByRole("listbox")).toBeDefined();

      // Select with Enter
      const options = screen.getAllByRole("option");
      const indonesianOption = options.find((opt) =>
        opt.textContent?.includes("Bahasa Indonesia"),
      );
      expect(indonesianOption).toBeDefined();
      fireEvent.keyDown(indonesianOption!, { key: "Enter" });
      expect(mockChangeLocale).toHaveBeenCalledWith("id_ID");
    });

    it("supports keyboard navigation with Space key", () => {
      render(<LanguageSwitcher variant="dropdown" />);

      const button = screen.getByRole("button");

      // Open with Space
      fireEvent.keyDown(button, { key: " " });
      expect(screen.getByRole("listbox")).toBeDefined();
    });
  });
});
