import { describe, it, expect, beforeEach, vi } from "vitest";
import sitemap from "../sitemap";

describe("sitemap.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_BASE_URL;
  });

  describe("Default Configuration", () => {
    it("should return sitemap array", () => {
      const result = sitemap();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should use default base URL when env var is not set", () => {
      const result = sitemap();
      const firstItem = result[0];
      expect(firstItem.url).toBe("https://infinitedim.site");
    });

    it("should use NEXT_PUBLIC_BASE_URL when set", () => {
      process.env.NEXT_PUBLIC_BASE_URL = "https://example.com";
      const result = sitemap();
      const firstItem = result[0];
      expect(firstItem.url).toBe("https://example.com");
    });
  });

  describe("Static Routes", () => {
    it("should include home page", () => {
      const result = sitemap();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://infinitedim.site";
      const homePage = result.find((item) => item.url === baseUrl || item.url === `${baseUrl}/`);
      expect(homePage).toBeDefined();
      expect(homePage?.priority).toBe(1.0);
      expect(homePage?.changeFrequency).toBe("weekly");
    });

    it("should include projects page", () => {
      const result = sitemap();
      const projectsPage = result.find(
        (item) =>
          item.url.includes("/projects") && !item.url.includes("/projects/"),
      );
      expect(projectsPage).toBeDefined();
      expect(projectsPage?.priority).toBe(0.9);
    });

    it("should include skills page", () => {
      const result = sitemap();
      const skillsPage = result.find((item) => item.url.includes("/skills"));
      expect(skillsPage).toBeDefined();
      expect(skillsPage?.priority).toBe(0.8);
    });

    it("should include about page", () => {
      const result = sitemap();
      const aboutPage = result.find((item) => item.url.includes("/about"));
      expect(aboutPage).toBeDefined();
      expect(aboutPage?.priority).toBe(0.7);
    });

    it("should include contact page", () => {
      const result = sitemap();
      const contactPage = result.find((item) => item.url.includes("/contact"));
      expect(contactPage).toBeDefined();
      expect(contactPage?.priority).toBe(0.6);
    });

    it("should include resume page", () => {
      const result = sitemap();
      const resumePage = result.find((item) => item.url.includes("/resume"));
      expect(resumePage).toBeDefined();
      expect(resumePage?.priority).toBe(0.7);
    });

    it("should include blog page", () => {
      const result = sitemap();
      const blogPage = result.find(
        (item) => item.url.includes("/blog") && !item.url.includes("/blog/"),
      );
      expect(blogPage).toBeDefined();
      expect(blogPage?.priority).toBe(0.8);
    });
  });

  describe("Dynamic Project Routes", () => {
    it("should include terminal-portfolio project", () => {
      const result = sitemap();
      const project = result.find((item) =>
        item.url.includes("terminal-portfolio"),
      );
      expect(project).toBeDefined();
      expect(project?.priority).toBe(0.9);
    });

    it("should include ecommerce-platform project", () => {
      const result = sitemap();
      const project = result.find((item) =>
        item.url.includes("ecommerce-platform"),
      );
      expect(project).toBeDefined();
      expect(project?.priority).toBe(0.8);
    });

    it("should include task-management project", () => {
      const result = sitemap();
      const project = result.find((item) =>
        item.url.includes("task-management"),
      );
      expect(project).toBeDefined();
      expect(project?.priority).toBe(0.8);
    });

    it("should include weather-dashboard project", () => {
      const result = sitemap();
      const project = result.find((item) =>
        item.url.includes("weather-dashboard"),
      );
      expect(project).toBeDefined();
      expect(project?.priority).toBe(0.7);
    });

    it("should include chat-application project", () => {
      const result = sitemap();
      const project = result.find((item) =>
        item.url.includes("chat-application"),
      );
      expect(project).toBeDefined();
      expect(project?.priority).toBe(0.7);
    });

    it("should include portfolio-website project", () => {
      const result = sitemap();
      const project = result.find((item) =>
        item.url.includes("portfolio-website"),
      );
      expect(project).toBeDefined();
      expect(project?.priority).toBe(0.8);
    });

    it("should have lastModified dates for projects", () => {
      const result = sitemap();
      const projects = result.filter((item) => item.url.includes("/projects/"));
      projects.forEach((project) => {
        expect(project.lastModified).toBeInstanceOf(Date);
      });
    });
  });

  describe("Technology Routes", () => {
    it("should include react skill page", () => {
      const result = sitemap();
      const skillPage = result.find((item) =>
        item.url.includes("/skills/react"),
      );
      expect(skillPage).toBeDefined();
      expect(skillPage?.priority).toBe(0.7);
    });

    it("should include nextjs skill page", () => {
      const result = sitemap();
      const skillPage = result.find((item) =>
        item.url.includes("/skills/nextjs"),
      );
      expect(skillPage).toBeDefined();
      expect(skillPage?.priority).toBe(0.7);
    });

    it("should include typescript skill page", () => {
      const result = sitemap();
      const skillPage = result.find((item) =>
        item.url.includes("/skills/typescript"),
      );
      expect(skillPage).toBeDefined();
      expect(skillPage?.priority).toBe(0.7);
    });

    it("should include nodejs skill page", () => {
      const result = sitemap();
      const skillPage = result.find((item) =>
        item.url.includes("/skills/nodejs"),
      );
      expect(skillPage).toBeDefined();
      expect(skillPage?.priority).toBe(0.7);
    });

    it("should include javascript skill page", () => {
      const result = sitemap();
      const skillPage = result.find((item) =>
        item.url.includes("/skills/javascript"),
      );
      expect(skillPage).toBeDefined();
      expect(skillPage?.priority).toBe(0.6);
    });

    it("should include python skill page", () => {
      const result = sitemap();
      const skillPage = result.find((item) =>
        item.url.includes("/skills/python"),
      );
      expect(skillPage).toBeDefined();
      expect(skillPage?.priority).toBe(0.6);
    });
  });

  describe("Service Routes", () => {
    it("should include web-development service page", () => {
      const result = sitemap();
      const servicePage = result.find((item) =>
        item.url.includes("/services/web-development"),
      );
      expect(servicePage).toBeDefined();
      expect(servicePage?.priority).toBe(0.8);
    });

    it("should include frontend-development service page", () => {
      const result = sitemap();
      const servicePage = result.find((item) =>
        item.url.includes("/services/frontend-development"),
      );
      expect(servicePage).toBeDefined();
      expect(servicePage?.priority).toBe(0.8);
    });

    it("should include backend-development service page", () => {
      const result = sitemap();
      const servicePage = result.find((item) =>
        item.url.includes("/services/backend-development"),
      );
      expect(servicePage).toBeDefined();
      expect(servicePage?.priority).toBe(0.8);
    });

    it("should include full-stack-development service page", () => {
      const result = sitemap();
      const servicePage = result.find((item) =>
        item.url.includes("/services/full-stack-development"),
      );
      expect(servicePage).toBeDefined();
      expect(servicePage?.priority).toBe(0.9);
    });

    it("should include react-development service page", () => {
      const result = sitemap();
      const servicePage = result.find((item) =>
        item.url.includes("/services/react-development"),
      );
      expect(servicePage).toBeDefined();
      expect(servicePage?.priority).toBe(0.8);
    });

    it("should include nextjs-development service page", () => {
      const result = sitemap();
      const servicePage = result.find((item) =>
        item.url.includes("/services/nextjs-development"),
      );
      expect(servicePage).toBeDefined();
      expect(servicePage?.priority).toBe(0.8);
    });
  });

  describe("Blog Routes", () => {
    it("should include web-development-tips blog post", () => {
      const result = sitemap();
      const blogPost = result.find((item) =>
        item.url.includes("/blog/web-development-tips"),
      );
      expect(blogPost).toBeDefined();
      expect(blogPost?.priority).toBe(0.6);
    });

    it("should include react-best-practices blog post", () => {
      const result = sitemap();
      const blogPost = result.find((item) =>
        item.url.includes("/blog/react-best-practices"),
      );
      expect(blogPost).toBeDefined();
      expect(blogPost?.priority).toBe(0.6);
    });

    it("should include nextjs-optimization blog post", () => {
      const result = sitemap();
      const blogPost = result.find((item) =>
        item.url.includes("/blog/nextjs-optimization"),
      );
      expect(blogPost).toBeDefined();
      expect(blogPost?.priority).toBe(0.6);
    });

    it("should include typescript-tips blog post", () => {
      const result = sitemap();
      const blogPost = result.find((item) =>
        item.url.includes("/blog/typescript-tips"),
      );
      expect(blogPost).toBeDefined();
      expect(blogPost?.priority).toBe(0.6);
    });

    it("should have lastModified dates for blog posts", () => {
      const result = sitemap();
      const blogPosts = result.filter((item) => item.url.includes("/blog/"));
      blogPosts.forEach((post) => {
        expect(post.lastModified).toBeInstanceOf(Date);
      });
    });
  });

  describe("Legal Routes", () => {
    it("should include privacy-policy page", () => {
      const result = sitemap();
      const legalPage = result.find((item) =>
        item.url.includes("/privacy-policy"),
      );
      expect(legalPage).toBeDefined();
      expect(legalPage?.priority).toBe(0.3);
      expect(legalPage?.changeFrequency).toBe("yearly");
    });

    it("should include terms-of-service page", () => {
      const result = sitemap();
      const legalPage = result.find((item) =>
        item.url.includes("/terms-of-service"),
      );
      expect(legalPage).toBeDefined();
      expect(legalPage?.priority).toBe(0.3);
      expect(legalPage?.changeFrequency).toBe("yearly");
    });

    it("should include sitemap.xml reference", () => {
      const result = sitemap();
      const sitemapRef = result.find((item) =>
        item.url.includes("/sitemap.xml"),
      );
      expect(sitemapRef).toBeDefined();
      expect(sitemapRef?.priority).toBe(0.5);
    });
  });

  describe("Route Properties", () => {
    it("should have url property for all routes", () => {
      const result = sitemap();
      result.forEach((item) => {
        expect(item).toHaveProperty("url");
        expect(typeof item.url).toBe("string");
        expect(item.url.length).toBeGreaterThan(0);
      });
    });

    it("should have lastModified property for all routes", () => {
      const result = sitemap();
      result.forEach((item) => {
        expect(item).toHaveProperty("lastModified");
        expect(item.lastModified).toBeInstanceOf(Date);
      });
    });

    it("should have changeFrequency property for all routes", () => {
      const result = sitemap();
      result.forEach((item) => {
        expect(item).toHaveProperty("changeFrequency");
        expect(typeof item.changeFrequency).toBe("string");
        expect([
          "always",
          "hourly",
          "daily",
          "weekly",
          "monthly",
          "yearly",
          "never",
        ]).toContain(item.changeFrequency);
      });
    });

    it("should have priority property for all routes", () => {
      const result = sitemap();
      result.forEach((item) => {
        expect(item).toHaveProperty("priority");
        expect(typeof item.priority).toBe("number");
        expect(item.priority).toBeGreaterThanOrEqual(0);
        expect(item.priority).toBeLessThanOrEqual(1);
      });
    });
  });
});
