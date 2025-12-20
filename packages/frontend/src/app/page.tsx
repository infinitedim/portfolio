import { Metadata } from "next";
import { Terminal } from "../components/terminal/Terminal";
import { StaticContent } from "../components/ssr/StaticContent";
import { type JSX, Suspense } from "react";
import { TerminalLoadingProgress } from "../components/ui/TerminalLoadingProgress";
import { HomeTerminalHeader } from "../components/ui/HomeTerminalHeader";

/**
 * Metadata for the home page
 * Includes SEO optimization with keywords, Open Graph, and Twitter Card data
 * @remarks
 * Canonical URL set to root for SEO best practices
 */
export const metadata: Metadata = {
  title: "Terminal Portfolio | Full-Stack Developer",
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
  ],
  openGraph: {
    title: "Terminal Portfolio | Full-Stack Developer",
    description:
      "Interactive developer portfolio with terminal interface. Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies.",
    type: "website",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Terminal Portfolio - Interactive Developer Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terminal Portfolio | Full-Stack Developer",
    description:
      "Interactive developer portfolio with terminal interface. Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
};

/**
 * Home page component displaying the terminal portfolio interface
 * @returns The home page with terminal component and SSR optimizations
 * @remarks
 * This is the main landing page using Next.js App Router with:
 * - Server-side rendering for initial content
 * - Suspense boundaries for progressive enhancement
 * - Screen reader accessibility with semantic HTML
 * - Structured data for SEO
 */
export default function HomePage(): JSX.Element {
  return (
    <>
      { }
      <div className="sr-only">
        <h1>Terminal Portfolio - Full-Stack Developer</h1>
        <p>
          Interactive developer portfolio showcasing React, Next.js, TypeScript,
          and modern web development projects.
        </p>
        <nav>
          <ul>
            <li>
              <a href="/projects">Projects</a>
            </li>
            <li>
              <a href="/skills">Skills</a>
            </li>
            <li>
              <a href="/about">About</a>
            </li>
            <li>
              <a href="/contact">Contact</a>
            </li>
          </ul>
        </nav>
      </div>

      <main
        id="main-content"
        className="relative"
      >
        <HomeTerminalHeader />
        <StaticContent />
        <Suspense
          fallback={
            <div className="min-h-screen w-full flex items-center justify-center bg-black text-white">
              <TerminalLoadingProgress />
            </div>
          }
        >
          <Terminal />
        </Suspense>
      </main>

      { }
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Terminal Portfolio",
            description:
              "Interactive developer portfolio with terminal interface",
            url: "https://infinitedim.site",
            mainEntity: {
              "@type": "Person",
              name: "Dimas Saputra",
              jobTitle: "Full-Stack Developer",
              description:
                "Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies",
            },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://infinitedim.site",
                },
              ],
            },
          }),
        }}
      />
    </>
  );
}
