import { Metadata } from "next";
import { Terminal } from "@portfolio/frontend/src/components/terminal/Terminal";
import { StaticContent } from "@portfolio/frontend/src/components/ssr/StaticContent";
import { type JSX, Suspense } from "react";
import { TerminalLoadingProgress } from "@portfolio/frontend/src/components/ui/TerminalLoadingProgress";
import { HomeTerminalHeader } from "@portfolio/frontend/src/components/ui/HomeTerminalHeader";

// Generate metadata for homepage
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
 * Homepage with SSR optimizations and streaming content
 * @returns {JSX.Element} The homepage
 */
export default function HomePage(): JSX.Element {
  return (
    <>
      {/* SEO-friendly static content for search engines */}
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
        {/* Terminal Header */}
        <HomeTerminalHeader />

        {/* Static content that can be server-rendered */}
        <StaticContent />

        {/* Interactive terminal with suspense boundary */}
        <Suspense
          fallback={
            <div
              className="min-h-screen w-full flex items-center justify-center"
              style={{
                backgroundColor: "#000000",
                color: "#ffffff",
              }}
            >
              <TerminalLoadingProgress />
            </div>
          }
        >
          <Terminal />
        </Suspense>
      </main>

      {/* Structured data for the homepage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Terminal Portfolio",
            description:
              "Interactive developer portfolio with terminal interface",
            url: "https://your-domain.com",
            mainEntity: {
              "@type": "Person",
              name: "Your Name",
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
                  item: "https://your-domain.com",
                },
              ],
            },
          }),
        }}
      />
    </>
  );
}
