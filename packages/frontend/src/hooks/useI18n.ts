import { useState, useEffect, useCallback } from "react";
import { i18n, t, type TranslationKeys } from "@/lib/i18n/i18nService";

/**
 * React hook for internationalization (i18n) with locale management
 *
 * Provides a React-friendly interface to the i18n service with features:
 * - Automatic re-rendering on locale changes
 * - Translation functions with fallback support
 * - Locale validation and info retrieval
 * - RTL (right-to-left) support
 * - Document direction management
 *
 * @returns {object} i18n utilities and state
 * @property {string} currentLocale - Current active locale code (e.g., 'en', 'es')
 * @property {boolean} isRTL - Whether current locale uses right-to-left text direction
 * @property {Function} t - Translate a key to current locale
 * @property {Function} tWithFallback - Translate with custom fallback text
 * @property {Function} changeLocale - Change the active locale
 * @property {Function} getCurrentLocaleConfig - Get current locale configuration
 * @property {Function} getSupportedLocales - Get array of supported locale codes
 * @property {Function} isLocaleSupported - Check if a locale is supported
 * @property {Function} getLocaleInfo - Get detailed info about a locale
 * @property {object} i18n - Raw i18n service instance for advanced usage
 *
 * @example
 * ```tsx
 * const {
 *   currentLocale,
 *   isRTL,
 *   t,
 *   changeLocale,
 *   getSupportedLocales
 * } = useI18n();
 *
 * // Translate a key
 * const greeting = t('common.greeting');
 *
 * // Change locale
 * changeLocale('es');
 *
 * // Get supported locales
 * const locales = getSupportedLocales();
 * ```
 */
export function useI18n() {
  const [currentLocale, setCurrentLocale] = useState(i18n.getCurrentLocale());
  const [isRTL, setIsRTL] = useState(i18n.isRTL());

  useEffect(() => {
    const unsubscribe = i18n.subscribe((locale) => {
      setCurrentLocale(locale);
      setIsRTL(i18n.isRTL());

      i18n.updateDocumentDirection();
    });

    i18n.updateDocumentDirection();

    return unsubscribe;
  }, []);

  const translate = useCallback((key: keyof TranslationKeys): string => {
    return t(key);
  }, []);

  const translateWithFallback = useCallback(
    (key: keyof TranslationKeys, fallback?: string): string => {
      return i18n.tWithFallback(key, fallback);
    },
    [],
  );

  const changeLocale = useCallback((localeCode: string): boolean => {
    return i18n.setLocale(localeCode);
  }, []);

  const getCurrentLocaleConfig = useCallback(() => {
    return i18n.getCurrentLocaleConfig();
  }, []);

  const getSupportedLocales = useCallback(() => {
    return i18n.getSupportedLocales();
  }, []);

  const isLocaleSupported = useCallback((localeCode: string): boolean => {
    return i18n.isLocaleSupported(localeCode);
  }, []);

  const getLocaleInfo = useCallback((localeCode: string) => {
    return i18n.getLocaleInfo(localeCode);
  }, []);

  return {
    currentLocale,
    isRTL,

    t: translate,
    tWithFallback: translateWithFallback,
    changeLocale,
    getCurrentLocaleConfig,
    getSupportedLocales,
    isLocaleSupported,
    getLocaleInfo,

    i18n,
  };
}
