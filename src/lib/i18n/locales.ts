/**
 * Configuration for a locale/language
 * @property code - Locale code in format 'language_COUNTRY' (e.g., 'en_US')
 * @property name - English name of the language
 * @property nativeName - Native name of the language
 * @property flag - Flag emoji for the locale
 * @property direction - Text direction ('ltr' for left-to-right, 'rtl' for right-to-left)
 * @property fallback - Optional fallback locale code for regional variants
 */
export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: "ltr" | "rtl";
  fallback?: string;
}

/**
 * Mapping of locale codes to their configurations
 * @example { 'en_US': { code: 'en_US', name: 'English (US)', ... } }
 */
export interface LocaleMapping {
  [key: string]: LocaleConfig;
}

/**
 * Registry of all supported locales with their configurations
 * Contains primary language locales (not regional variants)
 */
export const SUPPORTED_LOCALES: LocaleMapping = {
  en_US: {
    code: "en_US",
    name: "English (US)",
    nativeName: "English (American)",
    flag: "🇺🇸",
    direction: "ltr",
  },

  id_ID: {
    code: "id_ID",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    flag: "🇮🇩",
    direction: "ltr",
  },

  es_ES: {
    code: "es_ES",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    direction: "ltr",
  },

  fr_FR: {
    code: "fr_FR",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    direction: "ltr",
  },

  de_DE: {
    code: "de_DE",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    direction: "ltr",
  },

  ja_JP: {
    code: "ja_JP",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    direction: "ltr",
  },

  ko_KR: {
    code: "ko_KR",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    direction: "ltr",
  },

  zh_CN: {
    code: "zh_CN",
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    flag: "🇨🇳",
    direction: "ltr",
  },

  ar_SA: {
    code: "ar_SA",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    direction: "rtl",
  },

  pt_BR: {
    code: "pt_BR",
    name: "Portuguese (Brazil)",
    nativeName: "Português (Brasil)",
    flag: "🇧🇷",
    direction: "ltr",
  },

  ru_RU: {
    code: "ru_RU",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    direction: "ltr",
  },

  it_IT: {
    code: "it_IT",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    direction: "ltr",
  },

  nl_NL: {
    code: "nl_NL",
    name: "Dutch",
    nativeName: "Nederlands",
    flag: "🇳🇱",
    direction: "ltr",
  },

  tr_TR: {
    code: "tr_TR",
    name: "Turkish",
    nativeName: "Türkçe",
    flag: "🇹🇷",
    direction: "ltr",
  },

  hi_IN: {
    code: "hi_IN",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    direction: "ltr",
  },

  th_TH: {
    code: "th_TH",
    name: "Thai",
    nativeName: "ไทย",
    flag: "🇹🇭",
    direction: "ltr",
  },

  vi_VN: {
    code: "vi_VN",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    flag: "🇻🇳",
    direction: "ltr",
  },
};

/**
 * Regional variants that map to primary locales
 * e.g., en_GB, en_CA all fallback to en_US
 */
export const REGIONAL_VARIANTS: LocaleMapping = {
  en_GB: {
    code: "en_US",
    name: "English (US)",
    nativeName: "English (American)",
    flag: "🇺🇸",
    direction: "ltr",
    fallback: "en_US",
  },
  en_CA: {
    code: "en_US",
    name: "English (US)",
    nativeName: "English (American)",
    flag: "🇺🇸",
    direction: "ltr",
    fallback: "en_US",
  },
  en_AU: {
    code: "en_US",
    name: "English (US)",
    nativeName: "English (American)",
    flag: "🇺🇸",
    direction: "ltr",
    fallback: "en_US",
  },
  en_NZ: {
    code: "en_US",
    name: "English (US)",
    nativeName: "English (American)",
    flag: "🇺🇸",
    direction: "ltr",
    fallback: "en_US",
  },
  en_IE: {
    code: "en_US",
    name: "English (US)",
    nativeName: "English (American)",
    flag: "🇺🇸",
    direction: "ltr",
    fallback: "en_US",
  },
  en_IN: {
    code: "en_US",
    name: "English (US)",
    nativeName: "English (American)",
    flag: "🇺🇸",
    direction: "ltr",
    fallback: "en_US",
  },

  es_MX: {
    code: "es_ES",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    direction: "ltr",
    fallback: "es_ES",
  },
  es_AR: {
    code: "es_ES",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    direction: "ltr",
    fallback: "es_ES",
  },
  es_CO: {
    code: "es_ES",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    direction: "ltr",
    fallback: "es_ES",
  },

  fr_CA: {
    code: "fr_FR",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    direction: "ltr",
    fallback: "fr_FR",
  },
  fr_BE: {
    code: "fr_FR",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    direction: "ltr",
    fallback: "fr_FR",
  },

  de_AT: {
    code: "de_DE",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    direction: "ltr",
    fallback: "de_DE",
  },
  de_CH: {
    code: "de_DE",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    direction: "ltr",
    fallback: "de_DE",
  },

  pt_PT: {
    code: "pt_BR",
    name: "Portuguese (Brazil)",
    nativeName: "Português (Brasil)",
    flag: "🇧🇷",
    direction: "ltr",
    fallback: "pt_BR",
  },

  zh_TW: {
    code: "zh_CN",
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    flag: "🇨🇳",
    direction: "ltr",
    fallback: "zh_CN",
  },
  zh_HK: {
    code: "zh_CN",
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    flag: "🇨🇳",
    direction: "ltr",
    fallback: "zh_CN",
  },

  ar_EG: {
    code: "ar_SA",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    direction: "rtl",
    fallback: "ar_SA",
  },
  ar_AE: {
    code: "ar_SA",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    direction: "rtl",
    fallback: "ar_SA",
  },
};

/**
 * Combined mapping of all locales including regional variants
 */
export const ALL_LOCALES = { ...SUPPORTED_LOCALES, ...REGIONAL_VARIANTS };

/**
 * Default locale used when no locale is specified or detected
 */
export const DEFAULT_LOCALE = "en_US";

/**
 * Retrieves locale configuration by locale code
 * Normalizes hyphens to underscores (e.g., 'en-US' → 'en_US')
 * @param localeCode - Locale code to look up
 * @returns Locale configuration object, or null if not found
 * @example
 * ```ts
 * const config = getLocaleConfig('en-US');
 * console.log(config?.name); // 'English (US)'
 * ```
 */
export function getLocaleConfig(localeCode: string): LocaleConfig | null {
  const normalizedCode = localeCode.replace("-", "_");
  return ALL_LOCALES[normalizedCode] || null;
}

/**
 * Checks if a locale code is a regional variant (has a fallback)
 * @param localeCode - Locale code to check
 * @returns True if the locale is a regional variant, false otherwise
 * @example
 * ```ts
 * isRegionalVariant('en_GB'); // true (fallback to en_US)
 * isRegionalVariant('en_US'); // false (primary locale)
 * ```
 */
export function isRegionalVariant(localeCode: string): boolean {
  const normalizedCode = localeCode.replace("-", "_");
  return !!REGIONAL_VARIANTS[normalizedCode];
}

/**
 * Gets the fallback locale for regional variants
 * Returns the same code if not a regional variant
 * @param localeCode - Locale code to get fallback for
 * @returns Fallback locale code
 * @example
 * ```ts
 * getFallbackLocale('en_GB'); // 'en_US'
 * getFallbackLocale('en_US'); // 'en_US'
 * ```
 */
export function getFallbackLocale(localeCode: string): string {
  const normalizedCode = localeCode.replace("-", "_");
  const config = REGIONAL_VARIANTS[normalizedCode];
  return config?.fallback || normalizedCode;
}

/**
 * Gets list of all primary supported locales (excludes regional variants)
 * @returns Array of locale configuration objects
 * @example
 * ```ts
 * const locales = getSupportedLocales();
 * locales.forEach(locale => console.log(locale.name));
 * ```
 */
export function getSupportedLocales(): LocaleConfig[] {
  return Object.values(SUPPORTED_LOCALES);
}

/**
 * Validates if a locale code is supported (including regional variants)
 * @param localeCode - Locale code to validate
 * @returns True if locale is valid, false otherwise
 * @example
 * ```ts
 * isValidLocale('en_US'); // true
 * isValidLocale('en_GB'); // true (regional variant)
 * isValidLocale('xx_XX'); // false
 * ```
 */
export function isValidLocale(localeCode: string): boolean {
  const normalizedCode = localeCode.replace("-", "_");
  return !!ALL_LOCALES[normalizedCode];
}
