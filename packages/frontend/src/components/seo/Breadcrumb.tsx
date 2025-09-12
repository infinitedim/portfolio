"use client";

import Link from "next/link";
import { type JSX } from "react";

interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb component for better SEO and navigation
 * @param {BreadcrumbProps} props - Breadcrumb properties
 * @returns {JSX.Element} The breadcrumb component
 */
export function Breadcrumb({
  items,
  className = "",
}: BreadcrumbProps): JSX.Element {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://infinitedim.site";

  // Generate structured data for breadcrumbs
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${baseUrl}${item.href}`,
    })),
  };

  return (
    <>
      {/* Structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      {/* Visual breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 ${className}`}
      >
        <ol className="flex items-center space-x-2">
          {items.map((item, index) => (
            <li
              key={item.href}
              className="flex items-center"
            >
              {index > 0 && (
                <svg
                  className="w-4 h-4 mx-2 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}

              {item.current ? (
                <span
                  className="font-medium text-gray-900 dark:text-gray-100"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/**
 * Predefined breadcrumb for common pages
 */
export const BreadcrumbTemplates = {
  home: () => [{ label: "Home", href: "/", current: true }],

  projects: () => [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects", current: true },
  ],

  project: (projectName: string, projectSlug: string) => [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: projectName, href: `/projects/${projectSlug}`, current: true },
  ],

  skills: () => [
    { label: "Home", href: "/" },
    { label: "Skills", href: "/skills", current: true },
  ],

  skill: (skillName: string, skillSlug: string) => [
    { label: "Home", href: "/" },
    { label: "Skills", href: "/skills" },
    { label: skillName, href: `/skills/${skillSlug}`, current: true },
  ],

  about: () => [
    { label: "Home", href: "/" },
    { label: "About", href: "/about", current: true },
  ],

  contact: () => [
    { label: "Home", href: "/" },
    { label: "Contact", href: "/contact", current: true },
  ],

  blog: () => [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog", current: true },
  ],

  blogPost: (postTitle: string, postSlug: string) => [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: postTitle, href: `/blog/${postSlug}`, current: true },
  ],

  services: () => [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services", current: true },
  ],

  service: (serviceName: string, serviceSlug: string) => [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: serviceName, href: `/services/${serviceSlug}`, current: true },
  ],
};
