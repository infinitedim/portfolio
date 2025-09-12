export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: "ltr" | "rtl";
  fallback?: string; // For regional variants that fall back to main language
}

export interface LocaleMapping {
  [key: string]: LocaleConfig;
}

// Supported locales configuration
export const SUPPORTED_LOCALES: LocaleMapping = {
  // English (American) - Primary English
  en_US: {
    code: "en_US",
    name: "English (US)",
    nativeName: "English (American)",
    flag: "🇺🇸",
    direction: "ltr",
  },

  // Indonesian
  id_ID: {
    code: "id_ID",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    flag: "🇮🇩",
    direction: "ltr",
  },

  // Spanish
  es_ES: {
    code: "es_ES",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    direction: "ltr",
  },

  // French
  fr_FR: {
    code: "fr_FR",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    direction: "ltr",
  },

  // German
  de_DE: {
    code: "de_DE",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    direction: "ltr",
  },

  // Japanese
  ja_JP: {
    code: "ja_JP",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    direction: "ltr",
  },

  // Korean
  ko_KR: {
    code: "ko_KR",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    direction: "ltr",
  },

  // Chinese (Simplified)
  zh_CN: {
    code: "zh_CN",
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    flag: "🇨🇳",
    direction: "ltr",
  },

  // Arabic
  ar_SA: {
    code: "ar_SA",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    direction: "rtl",
  },

  // Portuguese
  pt_BR: {
    code: "pt_BR",
    name: "Portuguese (Brazil)",
    nativeName: "Português (Brasil)",
    flag: "🇧🇷",
    direction: "ltr",
  },

  // Russian
  ru_RU: {
    code: "ru_RU",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    direction: "ltr",
  },

  // Italian
  it_IT: {
    code: "it_IT",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    direction: "ltr",
  },

  // Dutch
  nl_NL: {
    code: "nl_NL",
    name: "Dutch",
    nativeName: "Nederlands",
    flag: "🇳🇱",
    direction: "ltr",
  },

  // Turkish
  tr_TR: {
    code: "tr_TR",
    name: "Turkish",
    nativeName: "Türkçe",
    flag: "🇹🇷",
    direction: "ltr",
  },

  // Hindi
  hi_IN: {
    code: "hi_IN",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    direction: "ltr",
  },

  // Thai
  th_TH: {
    code: "th_TH",
    name: "Thai",
    nativeName: "ไทย",
    flag: "🇹🇭",
    direction: "ltr",
  },

  // Vietnamese
  vi_VN: {
    code: "vi_VN",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    flag: "🇻🇳",
    direction: "ltr",
  },
};

// Regional variants that fall back to main language
export const REGIONAL_VARIANTS: LocaleMapping = {
  // English variants fall back to en_US
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

  // Spanish variants fall back to es_ES
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

  // French variants fall back to fr_FR
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

  // German variants fall back to de_DE
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

  // Portuguese variants fall back to pt_BR
  pt_PT: {
    code: "pt_BR",
    name: "Portuguese (Brazil)",
    nativeName: "Português (Brasil)",
    flag: "🇧🇷",
    direction: "ltr",
    fallback: "pt_BR",
  },

  // Chinese variants fall back to zh_CN
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

  // Arabic variants fall back to ar_SA
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

// Combine all locales
export const ALL_LOCALES = { ...SUPPORTED_LOCALES, ...REGIONAL_VARIANTS };

// Default locale
export const DEFAULT_LOCALE = "en_US";

// Get locale config by code
/**
 * Get locale config by code
 * @param {string} localeCode - The locale code
 * @returns {LocaleConfig | null} The locale config
 */
export function getLocaleConfig(localeCode: string): LocaleConfig | null {
  const normalizedCode = localeCode.replace("-", "_");
  return ALL_LOCALES[normalizedCode] || null;
}

// Check if locale is a regional variant
/**
 * Check if locale is a regional variant
 * @param {string} localeCode - The locale code
 * @returns {boolean} Whether the locale is a regional variant
 */
export function isRegionalVariant(localeCode: string): boolean {
  const normalizedCode = localeCode.replace("-", "_");
  return !!REGIONAL_VARIANTS[normalizedCode];
}

// Get fallback locale for regional variants
/**
 * Get fallback locale for regional variants
 * @param {string} localeCode - The locale code
 * @returns {string} The fallback locale
 */
export function getFallbackLocale(localeCode: string): string {
  const normalizedCode = localeCode.replace("-", "_");
  const config = REGIONAL_VARIANTS[normalizedCode];
  return config?.fallback || normalizedCode;
}

// Get supported locales list
/**
 * Get supported locales list
 * @returns {LocaleConfig[]} The supported locales
 */
export function getSupportedLocales(): LocaleConfig[] {
  return Object.values(SUPPORTED_LOCALES);
}

// Validate locale code
/**
 * Validate locale code
 * @param {string} localeCode - The locale code
 * @returns {boolean} Whether the locale code is valid
 */
export function isValidLocale(localeCode: string): boolean {
  const normalizedCode = localeCode.replace("-", "_");
  return !!ALL_LOCALES[normalizedCode];
}
