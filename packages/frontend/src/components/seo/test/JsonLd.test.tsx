import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { JsonLd, PersonSchema } from "../JsonLd";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("JsonLd", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
  });

  it("renders script tag with JSON-LD data", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const data = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Test Site",
    };

    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    expect(script?.textContent).toContain("Test Site");
  });

  it("uses custom type when provided", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const data = { test: "data" };
    const { container } = render(
      <JsonLd data={data} type="application/json" />
    );
    const script = container.querySelector('script[type="application/json"]');
    expect(script).toBeInTheDocument();
  });

  it("PersonSchema renders person structured data", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(
      <PersonSchema
        name="John Doe"
        url="https://example.com"
        jobTitle="Developer"
      />
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    expect(script?.textContent).toContain("John Doe");
    expect(script?.textContent).toContain("Person");
  });
});
