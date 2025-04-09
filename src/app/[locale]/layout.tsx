import { NextIntlClientProvider } from "next-intl";
import type { JSX, ReactNode } from "react";
import { notFound } from "next/navigation";
import { Layout } from "@/components/templates";
import { locales } from "@/i18n";

/**
 * Generates static parameters for localization.
 * @returns {Array<{ locale: string }>} An array of objects containing locale information.
 */
export function generateStaticParams(): Array<{ locale: string }> {
  return locales.map((locale) => ({ locale }));
}

/**
 * LocaleLayout component for rendering localized layouts.
 * @param {object} root0 - The input parameters.
 * @param {ReactNode} root0.children - The child components to render inside the layout.
 * @param {Promise<{ locale: string }>} root0.params - A promise resolving to an object containing the locale.
 * @returns {JSX.Element} The rendered layout component.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}): Promise<JSX.Element> {
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();

  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
    >
      <Layout>{children}</Layout>
    </NextIntlClientProvider>
  );
}
