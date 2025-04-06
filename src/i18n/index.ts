import { getRequestConfig } from "next-intl/server";

export const locales = ["en", "id", "pt"];
export const defaultLocale: string = "en";

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale: string = locale ?? defaultLocale;
  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
  };
});
