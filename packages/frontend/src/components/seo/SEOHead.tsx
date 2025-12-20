"use client";

import { useEffect, type JSX } from "react";

/**
 * Props for the SEOHead component
 * @interface SEOHeadProps
 * @property {string} [title] - Page title
 * @property {string} [description] - Page description for meta tags
 * @property {string[]} [keywords] - SEO keywords
 * @property {string} [image] - Open Graph image URL
 * @property {string} [url] - Page URL for canonical and OG tags
 * @property {"website" | "article" | "profile"} [type] - Open Graph type
 * @property {Record<string, unknown>} [structuredData] - Additional structured data
 * @property {boolean} [noindex] - Whether to prevent indexing
 * @property {string} [canonical] - Canonical URL override
 */
interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  structuredData?: Record<string, unknown>;
  noindex?: boolean;
  canonical?: string;
}

/**
 * SEO Head component for dynamic meta tags and structured data
 * Handles client-side updates of meta tags, Open Graph, Twitter Cards, and JSON-LD
 * @param {SEOHeadProps} props - Component props
 * @param {string} [props.title] - Page title
 * @param {string} [props.description] - Page description
 * @param {string[]} [props.keywords] - SEO keywords
 * @param {string} [props.image] - OG image (default: "/og-image.png")
 * @param {string} [props.url] - Page URL
 * @param {"website" | "article" | "profile"} [props.type] - OG type (default: "website")
 * @param {Record<string, unknown>} [props.structuredData] - JSON-LD data
 * @param {boolean} [props.noindex] - Prevent indexing (default: false)
 * @param {string} [props.canonical] - Canonical URL
 * @returns {null} This component doesn't render anything visible
 * @example
 * ```tsx
 * <SEOHead
 *   title="My Portfolio"
 *   description="Welcome to my portfolio"
 *   keywords={['developer', 'portfolio']}
 * />
 * ```
 */
export function SEOHead({
  title,
  description,
  keywords = [],
  image = "/og-image.png",
  url,
  type = "website",
  structuredData,
  noindex = false,
  canonical,
}: SEOHeadProps): null {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://infinitedim.site";
    const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
    const fullImageUrl = image.startsWith("http")
      ? image
      : `${baseUrl}${image}`;

    if (title) {
      document.title = title;
    }

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    if (description) {
      metaDescription.setAttribute("content", description);
    }

    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement("meta");
      metaKeywords.setAttribute("name", "keywords");
      document.head.appendChild(metaKeywords);
    }
    if (keywords.length > 0) {
      metaKeywords.setAttribute("content", keywords.join(", "));
    }

    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute(
      "content",
      noindex ? "noindex, nofollow" : "index, follow",
    );

    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", canonical || fullUrl);

    const ogTags = [
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: fullUrl },
      { property: "og:image", content: fullImageUrl },
      { property: "og:site_name", content: "Terminal Portfolio" },
    ];

    ogTags.forEach(({ property, content }) => {
      if (!content) return;

      let metaTag = document.querySelector(`meta[property="${property}"]`);
      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.setAttribute("property", property);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute("content", content);
    });

    const twitterTags = [
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: fullImageUrl },
      { name: "twitter:site", content: "@yourblooo" },
      { name: "twitter:creator", content: "@yourblooo" },
    ];

    twitterTags.forEach(({ name, content }) => {
      if (!content) return;

      let metaTag = document.querySelector(`meta[name="${name}"]`);
      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.setAttribute("name", name);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute("content", content);
    });

    if (structuredData) {
      let scriptTag = document.querySelector(
        'script[type="application/ld+json"]',
      );
      if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.setAttribute("type", "application/ld+json");
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(structuredData);
    }

    return () => {
      const dynamicTags = document.querySelectorAll(
        'meta[data-dynamic="true"]',
      );
      dynamicTags.forEach((tag) => tag.remove());
    };
  }, [
    title,
    description,
    keywords,
    image,
    url,
    type,
    structuredData,
    noindex,
    canonical,
  ]);

  return null;
}

/**
 * SEO Head component for project pages
 * @param {object} props - Project SEO properties
 * @param {string} props.projectName - Name of the project
 * @param {string} props.description - Project description
 * @param {string[]} props.technologies - Technologies used
 * @param {string} props.image - Project image
 * @param {string} props.url - Project URL
 * @returns {null} This component doesn't render anything
 */
export function ProjectSEO({
  projectName,
  description,
  technologies = [],
  image,
  url,
}: {
  projectName: string;
  description: string;
  technologies?: string[];
  image?: string;
  url?: string;
}): JSX.Element | null {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: projectName,
    description: description,
    applicationCategory: "WebApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "Your Name",
    },
    creator: {
      "@type": "Person",
      name: "Dimas Saputra",
    },
    keywords: technologies.join(", "),
    url:
      url ||
      `https://infinitedim.site/projects/${projectName.toLowerCase().replace(/\s+/g, "-")}`,
    image: image || "/og-image.png",
  };

  return (
    <SEOHead
      title={`${projectName} | Terminal Portfolio`}
      description={description}
      keywords={["web development", "project", ...technologies]}
      image={image}
      url={url}
      type="article"
      structuredData={structuredData}
    />
  );
}

/**
 * SEO Head component for skill pages
 * @param {object} props - Skill SEO properties
 * @param {string} props.skillName - Name of the skill
 * @param {string} props.description - Skill description
 * @param {string[]} props.relatedSkills - Related skills
 * @returns {null} This component doesn't render anything
 */
export function SkillSEO({
  skillName,
  description,
  relatedSkills = [],
}: {
  skillName: string;
  description: string;
  relatedSkills?: string[];
}): JSX.Element | null {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${skillName} Development Skills`,
    description: description,
    author: {
      "@type": "Person",
      name: "Dimas Saputra",
    },
    keywords: [skillName, "development", "programming", ...relatedSkills].join(
      ", ",
    ),
    url: `https://infinitedim.site/skills/${skillName.toLowerCase()}`,
    publisher: {
      "@type": "Organization",
      name: "Terminal Portfolio",
    },
  };

  return (
    <SEOHead
      title={`${skillName} Development | Terminal Portfolio`}
      description={description}
      keywords={[skillName, "development", "programming", ...relatedSkills]}
      type="article"
      structuredData={structuredData}
    />
  );
}
