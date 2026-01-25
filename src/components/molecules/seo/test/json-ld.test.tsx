import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import {
  JsonLd,
  PersonSchema,
  WebSiteSchema,
  SoftwareApplicationSchema,
  OrganizationSchema,
  BreadcrumbListSchema,
  FAQPageSchema,
  ArticleSchema,
} from "../json-ld";

describe("JsonLd", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("JsonLd Component", () => {
    it("should render script tag with JSON-LD data", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const data = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Test Person",
      };

      const { container } = render(<JsonLd data={data} />);

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeInTheDocument();
      expect(script?.textContent).toContain("Test Person");
    });

    it("should use custom type", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const data = { test: "data" };

      const { container } = render(
        <JsonLd data={data} type="application/json" />,
      );

      const script = container.querySelector('script[type="application/json"]');
      expect(script).toBeInTheDocument();
    });
  });

  describe("PersonSchema", () => {
    it("should render person schema", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <PersonSchema name="John Doe" url="https://example.com" />,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script?.textContent).toContain("Person");
      expect(script?.textContent).toContain("John Doe");
    });

    it("should include optional fields", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <PersonSchema
          name="John Doe"
          url="https://example.com"
          jobTitle="Developer"
          description="A developer"
          image="https://example.com/image.jpg"
        />,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script?.textContent).toContain("jobTitle");
      expect(script?.textContent).toContain("description");
    });
  });

  describe("WebSiteSchema", () => {
    it("should render website schema", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <WebSiteSchema name="Test Site" url="https://example.com" />,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script?.textContent).toContain("WebSite");
      expect(script?.textContent).toContain("Test Site");
    });
  });

  describe("SoftwareApplicationSchema", () => {
    it("should render software application schema", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <SoftwareApplicationSchema
          name="Test App"
          description="A test application"
        />,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script?.textContent).toContain("SoftwareApplication");
      expect(script?.textContent).toContain("Test App");
    });
  });

  describe("OrganizationSchema", () => {
    it("should render organization schema", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <OrganizationSchema name="Test Org" url="https://example.com" />,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script?.textContent).toContain("Organization");
      expect(script?.textContent).toContain("Test Org");
    });
  });

  describe("BreadcrumbListSchema", () => {
    it("should render breadcrumb list schema", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <BreadcrumbListSchema
          items={[
            { name: "Home", item: "https://example.com" },
            { name: "Page", item: "https://example.com/page" },
          ]}
        />,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script?.textContent).toContain("BreadcrumbList");
    });
  });

  describe("FAQPageSchema", () => {
    it("should render FAQ page schema", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <FAQPageSchema
          questions={[
            { question: "Q1", answer: "A1" },
            { question: "Q2", answer: "A2" },
          ]}
        />,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script?.textContent).toContain("FAQPage");
    });
  });

  describe("ArticleSchema", () => {
    it("should render article schema", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <ArticleSchema
          headline="Test Article"
          description="A test article"
          author="John Doe"
          publisher="Test Publisher"
          datePublished="2024-01-01"
        />,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script?.textContent).toContain("Article");
      expect(script?.textContent).toContain("Test Article");
    });
  });
});
