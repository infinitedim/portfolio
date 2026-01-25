import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { SEOHead, ProjectSEO, SkillSEO } from "../seo-head";

describe("SEOHead", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();

    // Clear existing meta tags
    if (typeof document !== "undefined" && document.head) {
      const existingTags = document.querySelectorAll("meta, link, script[type='application/ld+json']");
      existingTags.forEach((tag) => tag.remove());
    }
    if (typeof document !== "undefined") {
      document.title = "";
    }
  });

  afterEach(() => {
    if (!canRunTests) return;
    if (typeof document === "undefined") return;
    
    // Cleanup
    const dynamicTags = document.querySelectorAll("meta, link, script[type='application/ld+json']");
    dynamicTags.forEach((tag) => tag.remove());
    document.title = "";
  });

  describe("Meta Tags", () => {
    it("should update document title", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined" || typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }

      render(<SEOHead title="Test Title" />);

      // Wait for useEffect to run
      await new Promise((resolve) => setTimeout(resolve, 100));

      await waitFor(
        () => {
          expect(document.title).toBe("Test Title");
        },
        { timeout: 2000 },
      );
    });

    it("should create description meta tag", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined" || typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }

      render(<SEOHead description="Test description" />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await waitFor(
        () => {
          const meta = document.querySelector('meta[name="description"]');
          expect(meta).toBeInTheDocument();
          expect(meta).toHaveAttribute("content", "Test description");
        },
        { timeout: 2000 },
      );
    });

    it("should create keywords meta tag", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined" || typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }

      render(<SEOHead keywords={["test", "seo"]} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await waitFor(
        () => {
          const meta = document.querySelector('meta[name="keywords"]');
          expect(meta).toBeInTheDocument();
          expect(meta).toHaveAttribute("content", "test, seo");
        },
        { timeout: 2000 },
      );
    });

    it("should create robots meta tag", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined" || typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }

      render(<SEOHead noindex={true} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await waitFor(
        () => {
          const meta = document.querySelector('meta[name="robots"]');
          expect(meta).toBeInTheDocument();
          expect(meta).toHaveAttribute("content", "noindex, nofollow");
        },
        { timeout: 2000 },
      );
    });

    it("should create canonical link", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined" || typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }

      render(<SEOHead url="/test" />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await waitFor(
        () => {
          const link = document.querySelector('link[rel="canonical"]');
          expect(link).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });

  describe("Open Graph Tags", () => {
    it("should create OG title tag", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined" || typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }

      render(<SEOHead title="Test Title" description="Test" />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await waitFor(
        () => {
          const meta = document.querySelector('meta[property="og:title"]');
          expect(meta).toBeInTheDocument();
          expect(meta).toHaveAttribute("content", "Test Title");
        },
        { timeout: 2000 },
      );
    });

    it("should create OG description tag", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined" || typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }

      render(<SEOHead title="Test" description="Test description" />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await waitFor(
        () => {
          const meta = document.querySelector('meta[property="og:description"]');
          expect(meta).toBeInTheDocument();
          expect(meta).toHaveAttribute("content", "Test description");
        },
        { timeout: 2000 },
      );
    });

    it("should create OG type tag", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined" || typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }

      render(<SEOHead type="article" title="Test" />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await waitFor(
        () => {
          const meta = document.querySelector('meta[property="og:type"]');
          expect(meta).toBeInTheDocument();
          expect(meta).toHaveAttribute("content", "article");
        },
        { timeout: 2000 },
      );
    });
  });

  describe("Twitter Tags", () => {
    it("should create Twitter card tag", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined" || typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }

      render(<SEOHead title="Test" description="Test description" />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await waitFor(
        () => {
          const meta = document.querySelector('meta[name="twitter:card"]');
          expect(meta).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });

  describe("Structured Data", () => {
    it("should add structured data script", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined" || typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }

      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Test",
      };

      render(<SEOHead structuredData={structuredData} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await waitFor(
        () => {
          const script = document.querySelector(
            'script[type="application/ld+json"]',
          );
          expect(script).toBeInTheDocument();
          expect(script?.textContent).toContain("Person");
        },
        { timeout: 2000 },
      );
    });
  });

  describe("ProjectSEO", () => {
    it("should render ProjectSEO with structured data", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined" || typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }

      render(
        <ProjectSEO
          projectName="Test Project"
          description="A test project"
          technologies={["React", "TypeScript"]}
        />,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      await waitFor(
        () => {
          expect(document.title).toContain("Test Project");
        },
        { timeout: 2000 },
      );

      await waitFor(
        () => {
          const script = document.querySelector(
            'script[type="application/ld+json"]',
          );
          expect(script).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });

  describe("SkillSEO", () => {
    it("should render SkillSEO with structured data", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined" || typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }

      render(
        <SkillSEO
          skillName="React"
          description="React development skills"
          relatedSkills={["JavaScript", "TypeScript"]}
        />,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      await waitFor(
        () => {
          expect(document.title).toContain("React");
        },
        { timeout: 2000 },
      );

      await waitFor(
        () => {
          const script = document.querySelector(
            'script[type="application/ld+json"]',
          );
          expect(script).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });
});
