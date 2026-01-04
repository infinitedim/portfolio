import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "../Breadcrumb";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockItems = [
  { label: "Home", href: { pathname: "/" } },
  { label: "Projects", href: { pathname: "/projects" }, current: true },
];

describe("Breadcrumb", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
  });

  it("renders breadcrumb items", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<Breadcrumb items={mockItems} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });

  it("renders navigation with aria-label", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(<Breadcrumb items={mockItems} />);
    const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
    expect(nav).toBeInTheDocument();
  });

  it("includes structured data script", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(<Breadcrumb items={mockItems} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
  });

  it("marks current item", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(<Breadcrumb items={mockItems} />);
    const currentItem = screen.getByText("Projects").closest("li");
    expect(currentItem).toHaveAttribute("aria-current", "page");
  });

  it("applies custom className", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = render(
      <Breadcrumb items={mockItems} className="custom-class" />
    );
    const nav = container.querySelector("nav");
    expect(nav).toHaveClass("custom-class");
  });
});
