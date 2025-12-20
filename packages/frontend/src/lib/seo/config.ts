/**
 * SEO configuration for the portfolio site
 * Contains metadata, social links, keywords, and page-specific settings
 * Used for generating meta tags, Open Graph data, and structured data
 * @example
 * ```ts
 * import { SEO_CONFIG } from '@/lib/seo/config';
 * const title = SEO_CONFIG.site.title;
 * ```
 */
export const SEO_CONFIG = {
  site: {
    name: "Terminal Portfolio",
    title: "Terminal Portfolio | Full-Stack Developer",
    description:
      "Interactive developer portfolio with terminal interface. Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies.",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://infinitedim.site",
    author: "Dimas Saputra",
    email: "developer@infinitedim.site",
    phone: "",
    location: "Indonesia",
  },

  social: {
    twitter: "@yourblooo",
    github: "https://github.com/infinitedim",
    linkedin: "https://linkedin.com/in/infinitedim",
    instagram: "",
    youtube: "",
  },

  keywords: {
    home: [
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
    projects: [
      "web development projects",
      "react projects",
      "nextjs portfolio",
      "full-stack applications",
      "javascript projects",
      "typescript projects",
      "web applications",
      "portfolio projects",
    ],
    skills: [
      "web development skills",
      "programming skills",
      "technical skills",
      "developer skills",
      "coding skills",
      "software development",
      "programming languages",
      "frameworks",
    ],
    about: [
      "about developer",
      "developer background",
      "web developer experience",
      "developer bio",
      "professional experience",
      "developer story",
    ],
    contact: [
      "contact developer",
      "hire developer",
      "freelance developer",
      "web development services",
      "developer contact",
      "project inquiry",
    ],
    services: [
      "web development services",
      "frontend development",
      "backend development",
      "full-stack development",
      "react development",
      "nextjs development",
      "custom web applications",
      "website development",
    ],
  },

  images: {
    default: "/og-image.png",
    projects: "/og-projects.png",
    skills: "/og-skills.png",
    about: "/og-about.png",
    contact: "/og-contact.png",
    services: "/og-services.png",
  },

  pages: {
    home: {
      title: "Terminal Portfolio | Full-Stack Developer",
      description:
        "Interactive developer portfolio with terminal interface. Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies.",
      keywords:
        "full-stack developer, react developer, nextjs developer, typescript developer, web developer portfolio",
    },
    projects: {
      title: "Projects | Terminal Portfolio",
      description:
        "Explore web development projects including React, Next.js, and modern technologies. Full-stack applications built with cutting-edge web technologies.",
      keywords:
        "web development projects, react projects, nextjs portfolio, full-stack applications",
    },
    skills: {
      title: "Skills | Terminal Portfolio",
      description:
        "Comprehensive list of technical skills including React, Next.js, TypeScript, Node.js, and modern web development technologies.",
      keywords:
        "web development skills, programming skills, technical skills, developer skills",
    },
    about: {
      title: "About | Terminal Portfolio",
      description:
        "Learn about my background, experience, and passion for web development. Full-stack developer with expertise in modern technologies.",
      keywords:
        "about developer, developer background, web developer experience, developer bio",
    },
    contact: {
      title: "Contact | Terminal Portfolio",
      description:
        "Get in touch for web development projects, collaboration opportunities, or technical consulting. Available for freelance and full-time positions.",
      keywords:
        "contact developer, hire developer, freelance developer, web development services",
    },
    services: {
      title: "Services | Terminal Portfolio",
      description:
        "Professional web development services including frontend, backend, and full-stack development. Custom web applications and consulting.",
      keywords:
        "web development services, frontend development, backend development, full-stack development",
    },
  },

  structuredData: {
    person: {
      "@type": "Person",
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
    },
    website: {
      "@type": "WebSite",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://infinitedim.site/search?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    organization: {
      "@type": "Organization",
      name: "Terminal Portfolio",
      url: "https://infinitedim.site",
      logo: "https://infinitedim.site/logo.png",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "",
        contactType: "customer service",
        email: "developer@infinitedim.site",
      },
    },
  },

  robots: {
    userAgents: {
      googlebot: {
        allow: ["/", "/projects", "/skills", "/about", "/contact"],
        disallow: ["/api/", "/admin/", "/private/", "/_next/", "/sw.js"],
        crawlDelay: 1,
      },
      bingbot: {
        allow: ["/", "/projects", "/skills", "/about", "/contact"],
        disallow: ["/api/", "/admin/", "/private/", "/_next/", "/sw.js"],
        crawlDelay: 1,
      },
    },
  },

  sitemap: {
    staticPages: [
      { url: "/", priority: 1.0, changeFreq: "weekly" },
      { url: "/projects", priority: 0.9, changeFreq: "weekly" },
      { url: "/skills", priority: 0.8, changeFreq: "monthly" },
      { url: "/about", priority: 0.7, changeFreq: "monthly" },
      { url: "/contact", priority: 0.6, changeFreq: "yearly" },
      { url: "/services", priority: 0.8, changeFreq: "monthly" },
    ],
    dynamicPages: {
      projects: {
        priority: 0.8,
        changeFreq: "monthly",
      },
      skills: {
        priority: 0.7,
        changeFreq: "monthly",
      },
      blog: {
        priority: 0.6,
        changeFreq: "monthly",
      },
    },
  },
} as const;

export const SEO_HELPERS = {
  getPageTitle: (page: string, customTitle?: string): string => {
    if (customTitle) return customTitle;
    return (
      SEO_CONFIG.pages[page as keyof typeof SEO_CONFIG.pages]?.title ||
      SEO_CONFIG.site.title
    );
  },

  getPageDescription: (page: string, customDescription?: string): string => {
    if (customDescription) return customDescription;
    return (
      SEO_CONFIG.pages[page as keyof typeof SEO_CONFIG.pages]?.description ||
      SEO_CONFIG.site.description
    );
  },

  getPageKeywords: (page: string, customKeywords?: string[]): string[] => {
    if (customKeywords) return customKeywords;
    const keywords =
      SEO_CONFIG.keywords[page as keyof typeof SEO_CONFIG.keywords] ||
      SEO_CONFIG.keywords.home;
    return Array.from(keywords);
  },

  getCanonicalUrl: (path: string): string => {
    return `${SEO_CONFIG.site.url}${path}`;
  },

  getOGImage: (page: string): string => {
    const image = SEO_CONFIG.images[page as keyof typeof SEO_CONFIG.images];
    return image
      ? `${SEO_CONFIG.site.url}${image}`
      : `${SEO_CONFIG.site.url}${SEO_CONFIG.images.default}`;
  },
};
