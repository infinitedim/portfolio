"use client";

import { useState, useRef, useEffect, type JSX } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/hooks/useI18n";

/**
 * Props for the LanguageSwitcher component
 * @interface LanguageSwitcherProps
 * @property {"dropdown" | "list"} [variant] - Display style (dropdown or full list)
 * @property {string} [className] - Additional CSS classes
 * @property {boolean} [showNative] - Whether to show native language names
 * @property {boolean} [showFlags] - Whether to show flag emojis
 * @property {(locale: string) => void} [onLanguageChange] - Callback when language changes
 */
interface LanguageSwitcherProps {
  /** Whether to show as compact dropdown or full list */
  variant?: "dropdown" | "list";
  /** Custom class name */
  className?: string;
  /** Show native language names */
  showNative?: boolean;
  /** Show flag emojis */
  showFlags?: boolean;
  /** Callback when language changes */
  onLanguageChange?: (locale: string) => void;
}

/**
 * Language switcher component for changing application locale
 * Provides dropdown or list view with flags and native language names
 * @param {LanguageSwitcherProps} props - Component props
 * @param {"dropdown" | "list"} [props.variant="dropdown"] - Display style
 * @param {string} [props.className] - Additional classes
 * @param {boolean} [props.showNative=true] - Show native names
 * @param {boolean} [props.showFlags=true] - Show flags
 * @param {(locale: string) => void} [props.onLanguageChange] - Change callback
 * @returns {JSX.Element} The language switcher component
 * @example
 * ```tsx
 * <LanguageSwitcher
 *   variant="dropdown"
 *   showFlags={true}
 *   onLanguageChange={(locale) => console.log(locale)}
 * />
 * ```
 */
export function LanguageSwitcher({
  variant = "dropdown",
  className = "",
  showNative = true,
  showFlags = true,
  onLanguageChange,
}: LanguageSwitcherProps): JSX.Element {
  const { themeConfig } = useTheme();
  const {
    currentLocale,
    changeLocale,
    getSupportedLocales,
    getCurrentLocaleConfig,
  } = useI18n();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supportedLocales = getSupportedLocales();
  const currentConfig = getCurrentLocaleConfig();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (localeCode: string) => {
    const success = changeLocale(localeCode);
    if (success) {
      setIsOpen(false);
      onLanguageChange?.(localeCode);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, localeCode?: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (localeCode) {
        handleLanguageChange(localeCode);
      } else {
        setIsOpen(!isOpen);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  if (variant === "list") {
    return (
      <div
        className={`flex flex-wrap gap-2 ${className}`}
        role="listbox"
        aria-label="Select language"
      >
        {supportedLocales.map((locale) => {
          const isSelected = locale.code === currentLocale;
          return (
            <button
              key={locale.code}
              onClick={() => handleLanguageChange(locale.code)}
              onKeyDown={(e) => handleKeyDown(e, locale.code)}
              role="option"
              aria-selected={isSelected}
              className="px-3 py-1.5 rounded text-sm font-mono transition-all duration-200 border"
              style={{
                backgroundColor: isSelected
                  ? themeConfig.colors.accent
                  : themeConfig.colors.bg,
                color: isSelected
                  ? themeConfig.colors.bg
                  : themeConfig.colors.text,
                borderColor: isSelected
                  ? themeConfig.colors.accent
                  : themeConfig.colors.border,
              }}
            >
              {showFlags && <span className="mr-1">{locale.flag}</span>}
              {showNative ? locale.nativeName : locale.name}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative ${className}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => handleKeyDown(e)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Current language: ${currentConfig?.name}. Click to change.`}
        className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-mono transition-all duration-200 border hover:opacity-80"
        style={{
          backgroundColor: themeConfig.colors.bg,
          color: themeConfig.colors.text,
          borderColor: themeConfig.colors.border,
        }}
      >
        {showFlags && currentConfig && (
          <span className="text-base">{currentConfig.flag}</span>
        )}
        <span>
          {showNative
            ? currentConfig?.nativeName
            : currentConfig?.name || currentLocale}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Available languages"
          className="absolute top-full mt-1 right-0 min-w-48 max-h-64 overflow-y-auto rounded border shadow-lg z-50"
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.border,
          }}
        >
          {supportedLocales.map((locale) => {
            const isSelected = locale.code === currentLocale;
            return (
              <button
                key={locale.code}
                onClick={() => handleLanguageChange(locale.code)}
                onKeyDown={(e) => handleKeyDown(e, locale.code)}
                role="option"
                aria-selected={isSelected}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-mono transition-all duration-200 hover:opacity-80"
                style={{
                  backgroundColor: isSelected
                    ? `${themeConfig.colors.accent}20`
                    : "transparent",
                  color: isSelected
                    ? themeConfig.colors.accent
                    : themeConfig.colors.text,
                }}
              >
                {showFlags && <span className="text-base">{locale.flag}</span>}
                <span className="flex-1 text-left">
                  {showNative ? locale.nativeName : locale.name}
                </span>
                {isSelected && (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
