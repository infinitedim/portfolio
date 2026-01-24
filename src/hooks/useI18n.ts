import {useState, useEffect, useCallback, useMemo} from "react";
import {i18n, t, type TranslationKeys} from "@/lib/i18n/i18n-service";

/**
 * React hook for internationalization (i18n) with locale management
 *
 * Optimized for performance with:
 * - Stable callback references using useCallback
 * - Memoized derived values
 * - Automatic cleanup of subscriptions
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
 * const { currentLocale, isRTL, t, changeLocale } = useI18n();
 *
 * // Translate a key
 * const greeting = t('common.greeting');
 *
 * // Change locale
 * changeLocale('es');
 * ```
 */
export function useI18n() {
  const [currentLocale, setCurrentLocale] = useState(() => {
    try {
      return i18n?.getCurrentLocale() ?? "en";
    } catch {
      return "en";
    }
  });
  const [isRTL, setIsRTL] = useState(() => {
    try {
      return i18n?.isRTL() ?? false;
    } catch {
      return false;
    }
  });

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

  const localeUtils = useMemo(
    () => ({
      getCurrentLocaleConfig: () => i18n.getCurrentLocaleConfig(),
      getSupportedLocales: () => i18n.getSupportedLocales(),
      isLocaleSupported: (localeCode: string) =>
        i18n.isLocaleSupported(localeCode),
      getLocaleInfo: (localeCode: string) => i18n.getLocaleInfo(localeCode),
    }),
    [],
  );

  return {
    currentLocale,
    isRTL,
    t: translate,
    tWithFallback: translateWithFallback,
    changeLocale,
    ...localeUtils,
    i18n,
  };
}
