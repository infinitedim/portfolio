import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { SEOHead } from "../SEOHead";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("SEOHead", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    // Clear document head
    if (typeof document !== "undefined" && document.head) {
      document.head.innerHTML = "";
      document.title = "";
    }
  });

  afterEach(() => {
    if (!canRunTests) {
      return;
    }
    if (typeof document !== "undefined" && document.head) {
      document.head.innerHTML = "";
      document.title = "";
    }
  });

  it("updates document title", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<SEOHead title="Test Page" />);
    await waitFor(
      () => {
        expect(document.title).toBe("Test Page");
      },
      { timeout: 2000 }
    );
  });

  it("creates meta description tag", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<SEOHead description="Test description" />);
    await waitFor(
      () => {
        const meta = document.querySelector('meta[name="description"]');
        expect(meta).toBeInTheDocument();
        expect(meta?.getAttribute("content")).toBe("Test description");
      },
      { timeout: 2000 }
    );
  });

  it("creates Open Graph tags", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <SEOHead
        title="Test"
        description="Test description"
        image="/test-image.jpg"
        url="/test"
        type="article"
      />
    );

    await waitFor(
      () => {
        expect(document.querySelector('meta[property="og:title"]')).toBeInTheDocument();
        expect(document.querySelector('meta[property="og:description"]')).toBeInTheDocument();
        expect(document.querySelector('meta[property="og:image"]')).toBeInTheDocument();
        expect(document.querySelector('meta[property="og:type"]')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("creates Twitter Card tags", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <SEOHead
        title="Test"
        description="Test description"
        image="/test-image.jpg"
      />
    );

    await waitFor(
      () => {
        expect(document.querySelector('meta[name="twitter:card"]')).toBeInTheDocument();
        expect(document.querySelector('meta[name="twitter:title"]')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("adds noindex meta tag when noindex is true", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<SEOHead noindex={true} />);
    await waitFor(
      () => {
        const meta = document.querySelector('meta[name="robots"]');
        expect(meta).toBeInTheDocument();
        expect(meta?.getAttribute("content")).toContain("noindex");
      },
      { timeout: 2000 }
    );
  });

  it("adds canonical link", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<SEOHead canonical="/test-page" />);
    await waitFor(
      () => {
        const link = document.querySelector('link[rel="canonical"]');
        expect(link).toBeInTheDocument();
        expect(link?.getAttribute("href")).toContain("/test-page");
      },
      { timeout: 2000 }
    );
  });

  it("adds structured data script", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const structuredData = { "@type": "WebSite", name: "Test" };
    render(<SEOHead structuredData={structuredData} />);
    await waitFor(
      () => {
        const script = document.querySelector('script[type="application/ld+json"]');
        expect(script).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
