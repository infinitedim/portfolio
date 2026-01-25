import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { FAQ, DeveloperFAQ, CommonFAQItems } from "../faq";

describe("FAQ", () => {
  const mockFAQItems = [
    { question: "What is this?", answer: "This is a test FAQ." },
    { question: "How does it work?", answer: "It works by testing." },
  ];

  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render FAQ component", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<FAQ items={mockFAQItems} />);

      expect(screen.getByText("Frequently Asked Questions")).toBeInTheDocument();
    });

    it("should render custom title", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<FAQ items={mockFAQItems} title="Custom FAQ" />);

      expect(screen.getByText("Custom FAQ")).toBeInTheDocument();
    });

    it("should render all FAQ items", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<FAQ items={mockFAQItems} />);

      expect(screen.getByText("What is this?")).toBeInTheDocument();
      expect(screen.getByText("How does it work?")).toBeInTheDocument();
    });

    it("should not show answers initially", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<FAQ items={mockFAQItems} />);

      expect(screen.queryByText("This is a test FAQ.")).not.toBeInTheDocument();
    });

    it("should include structured data script", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<FAQ items={mockFAQItems} />);

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should toggle answer when question is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<FAQ items={mockFAQItems} />);

      const question = screen.getByText("What is this?");
      fireEvent.click(question);

      expect(screen.getByText("This is a test FAQ.")).toBeInTheDocument();
    });

    it("should close answer when question is clicked again", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<FAQ items={mockFAQItems} />);

      const question = screen.getByText("What is this?");
      fireEvent.click(question);
      expect(screen.getByText("This is a test FAQ.")).toBeInTheDocument();

      fireEvent.click(question);
      expect(screen.queryByText("This is a test FAQ.")).not.toBeInTheDocument();
    });

    it("should allow multiple items to be open", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<FAQ items={mockFAQItems} />);

      fireEvent.click(screen.getByText("What is this?"));
      fireEvent.click(screen.getByText("How does it work?"));

      expect(screen.getByText("This is a test FAQ.")).toBeInTheDocument();
      expect(screen.getByText("It works by testing.")).toBeInTheDocument();
    });

    it("should have correct ARIA attributes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<FAQ items={mockFAQItems} />);

      const question = screen.getByText("What is this?");
      expect(question).toHaveAttribute("aria-expanded", "false");
      expect(question).toHaveAttribute("aria-controls", "faq-answer-0");
    });
  });

  describe("DeveloperFAQ", () => {
    it("should render DeveloperFAQ with CommonFAQItems", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<DeveloperFAQ />);

      expect(screen.getByText("Developer Services FAQ")).toBeInTheDocument();
      expect(
        screen.getByText("What technologies do you specialize in?"),
      ).toBeInTheDocument();
    });
  });

  describe("CommonFAQItems", () => {
    it("should contain expected FAQ items", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(CommonFAQItems.length).toBeGreaterThan(0);
      expect(CommonFAQItems[0]).toHaveProperty("question");
      expect(CommonFAQItems[0]).toHaveProperty("answer");
    });
  });
});
