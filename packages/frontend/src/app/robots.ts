import { MetadataRoute } from "next";

/**
 * Robots.txt for the application
 * Optimized for Google indexing and SEO
 * @returns {MetadataRoute.Robots} The robots.txt
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://infinitedim.site";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/projects",
          "/skills",
          "/about",
          "/contact",
          "/sitemap.xml",
          "/robots.txt",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
          "/temp/",
          "/draft/",
          "/test/",
          "/dev/",
          "/staging/",
        ],
        crawlDelay: 1,
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/projects", "/skills", "/about", "/contact"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 1,
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/projects", "/images/", "/og-image.png", "/avatar.jpg"],
        disallow: ["/api/", "/admin/", "/private/", "/_next/", "/sw.js"],
        crawlDelay: 1,
      },
      {
        userAgent: "Googlebot-Mobile",
        allow: ["/", "/projects", "/skills", "/about", "/contact"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 1,
      },
      {
        userAgent: "Bingbot",
        allow: ["/", "/projects", "/skills", "/about", "/contact"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 1,
      },
      {
        userAgent: "Slurp", // Yahoo
        allow: ["/", "/projects", "/skills", "/about", "/contact"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 1,
      },
      {
        userAgent: "DuckDuckBot",
        allow: ["/", "/projects", "/skills", "/about", "/contact"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 1,
      },
      {
        userAgent: "GPTBot", // OpenAI's web crawler
        disallow: "/",
      },
      {
        userAgent: "CCBot", // Common Crawl
        allow: ["/", "/projects", "/skills", "/about", "/contact"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 10,
      },
      {
        userAgent: "AhrefsBot",
        allow: ["/", "/projects", "/skills", "/about", "/contact"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 10,
      },
      {
        userAgent: "SemrushBot",
        allow: ["/", "/projects", "/skills", "/about", "/contact"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 10,
      },
      {
        userAgent: "MJ12bot",
        allow: ["/", "/projects", "/skills", "/about", "/contact"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 10,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
