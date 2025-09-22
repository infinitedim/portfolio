import type { Metadata, Viewport } from "next";
import {
  Inter,
  JetBrains_Mono,
  Fira_Code,
  Source_Code_Pro,
  Inconsolata,
  Ubuntu_Mono,
  Roboto_Mono,
} from "next/font/google";
import "./globals.css";
import type { JSX, ReactNode } from "react";
import PWARegistration from "../components/pwa/PWARegistration";
import { TRPCProvider } from "../components/provider/TrpcProvider";
import { AuthProvider } from "../lib/auth";
import { AccessibilityProvider } from "../components/accessibility/AccessibilityProvider";
import { ScreenReaderAnnouncer } from "../components/accessibility/ScreenReaderAnnouncer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fira-code",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-code-pro",
});

const inconsolata = Inconsolata({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inconsolata",
});

const ubuntuMono = Ubuntu_Mono({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-ubuntu-mono",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#ffffff" },
  ],
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://infinitedim.site",
  ),
  title: {
    default: "Terminal Portfolio | Full-Stack Developer",
    template: "%s | Terminal Portfolio",
  },
  description:
    "Interactive developer portfolio with terminal interface. Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies. Explore projects, skills, and experience through an innovative terminal interface.",
  keywords: [
    "full-stack developer",
    "react developer",
    "nextjs developer",
    "typescript developer",
    "web developer portfolio",
    "terminal portfolio",
    "interactive portfolio",
    "modern web development",
    "frontend developer",
    "backend developer",
    "javascript developer",
    "node.js developer",
    "flutter developer",
    "flutter developer portfolio",
    "flutter web developer",
    "flutter web developer portfolio",
  ],
  authors: [{ name: "Dimas Saputra", url: "https://infinitedim.site" }],
  creator: "Dimas Saputra",
  publisher: "Dimas Saputra",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Terminal Portfolio",
    title: "Terminal Portfolio | Full-Stack Developer",
    description:
      "Interactive developer portfolio with terminal interface. Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Terminal Portfolio - Interactive Developer Portfolio",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@yourblooo",
    creator: "@yourblooo",
    title: "Terminal Portfolio | Full-Stack Developer",
    description:
      "Interactive developer portfolio with terminal interface. Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-US",
    },
  },
  category: "technology",
  classification: "Developer Portfolio",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Portfolio Terminal",
    startupImage: [
      {
        url: "/icons/apple-splash-2048-2732.png",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/icons/apple-splash-1668-2388.png",
        media:
          "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
    ],
  },
  other: {
    "msapplication-TileColor": "#000000",
    "theme-color": "#000000",
    "msapplication-config": "/browserconfig.xml",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Portfolio",
    "mobile-web-app-capable": "yes",
  },
};

/**
 * The root layout for the application.
 * No theme system - using simple components only.
 * @param {ReactNode} children - The children prop passed to the component.
 * @returns {JSX.Element} The root layout component.
 */
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${firaCode.variable} ${sourceCodePro.variable} ${inconsolata.variable} ${ubuntuMono.variable} ${robotoMono.variable}`}
    >
      <head>
        {/* Preconnect to external domains for performance */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* DNS prefetch for performance */}
        <link
          rel="dns-prefetch"
          href="//www.google-analytics.com"
        />
        <link
          rel="dns-prefetch"
          href="//www.googletagmanager.com"
        />

        {/* Structured Data for Person */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Dimas Saputra",
              url: "https://infinitedim.site",
              image: "https://infinitedim.site/avatar.jpg",
              sameAs: [
                "https://github.com/infinitedim",
                "https://linkedin.com/in/infinitedim",
                "https://twitter.com/yourblooo",
              ],
              jobTitle: "Full-Stack Developer",
              worksFor: {
                "@type": "Organization",
                name: "Freelance",
              },
              knowsAbout: [
                "React",
                "Next.js",
                "TypeScript",
                "Node.js",
                "Web Development",
                "Full-Stack Development",
              ],
              description:
                "Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies.",
            }),
          }}
        />

        {/* Structured Data for WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Terminal Portfolio",
              url: "https://infinitedim.site",
              description:
                "Interactive developer portfolio with terminal interface",
              author: {
                "@type": "Person",
                name: "Dimas Saputra",
              },
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://infinitedim.site/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <PWARegistration />
        <TRPCProvider>
          <AuthProvider>
            <AccessibilityProvider>
              <ScreenReaderAnnouncer message="Terminal Portfolio" />
              {children}
            </AccessibilityProvider>
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
