import { useState, useEffect, useCallback } from "react";
import {
  i18n,
  t,
  type TranslationKeys,
} from "@portfolio/frontend/src/lib/i18n/i18nService";

/**
 * React hook for internationalization
 * @returns {object} i18n utilities and current locale
 */
export function useI18n() {
  const [currentLocale, setCurrentLocale] = useState(i18n.getCurrentLocale());
  const [isRTL, setIsRTL] = useState(i18n.isRTL());

  // Subscribe to locale changes
  useEffect(() => {
    const unsubscribe = i18n.subscribe((locale) => {
      setCurrentLocale(locale);
      setIsRTL(i18n.isRTL());

      // Update document direction
      i18n.updateDocumentDirection();
    });

    // Initial setup
    i18n.updateDocumentDirection();

    return unsubscribe;
  }, []);

  // Translation function
  const translate = useCallback((key: keyof TranslationKeys): string => {
    return t(key);
  }, []);

  // Translation function with fallback
  const translateWithFallback = useCallback(
    (key: keyof TranslationKeys, fallback?: string): string => {
      return i18n.tWithFallback(key, fallback);
    },
    [],
  );

  // Change locale
  const changeLocale = useCallback((localeCode: string): boolean => {
    return i18n.setLocale(localeCode);
  }, []);

  // Get current locale config
  const getCurrentLocaleConfig = useCallback(() => {
    return i18n.getCurrentLocaleConfig();
  }, []);

  // Get supported locales
  const getSupportedLocales = useCallback(() => {
    return i18n.getSupportedLocales();
  }, []);

  // Check if locale is supported
  const isLocaleSupported = useCallback((localeCode: string): boolean => {
    return i18n.isLocaleSupported(localeCode);
  }, []);

  // Get locale info
  const getLocaleInfo = useCallback((localeCode: string) => {
    return i18n.getLocaleInfo(localeCode);
  }, []);

  return {
    // State
    currentLocale,
    isRTL,

    // Functions
    t: translate,
    tWithFallback: translateWithFallback,
    changeLocale,
    getCurrentLocaleConfig,
    getSupportedLocales,
    isLocaleSupported,
    getLocaleInfo,

    // Direct access to i18n service
    i18n,
  };
}
