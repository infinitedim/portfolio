"use client";

import { useState, type JSX } from "react";
// Simple chevron icons without external dependency
const ChevronDownIcon = () => (
  <svg
    className="w-5 h-5 text-gray-500"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      fillRule="evenodd"
      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

const ChevronUpIcon = () => (
  <svg
    className="w-5 h-5 text-gray-500"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      fillRule="evenodd"
      d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
      clipRule="evenodd"
    />
  </svg>
);

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
  title?: string;
  className?: string;
}

/**
 * FAQ component with structured data for SEO
 * @param {FAQProps} props - FAQ properties
 * @returns {JSX.Element} The FAQ component
 */
export function FAQ({
  items,
  title = "Frequently Asked Questions",
  className = "",
}: FAQProps): JSX.Element {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  // Generate structured data for FAQ
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      {/* FAQ Title */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {title}
      </h2>

      {/* FAQ Items */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
              aria-expanded={openItems.has(index)}
              aria-controls={`faq-answer-${index}`}
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {item.question}
              </span>
              {openItems.has(index) ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </button>

            {openItems.has(index) && (
              <div
                id={`faq-answer-${index}`}
                className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
              >
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Predefined FAQ items for common developer portfolio questions
 */
export const CommonFAQItems: FAQItem[] = [
  {
    question: "What technologies do you specialize in?",
    answer:
      "I specialize in modern web development technologies including React, Next.js, TypeScript, Node.js, and various other frontend and backend technologies. I have experience with both client-side and server-side development, as well as database design and API development.",
  },
  {
    question: "Do you take on freelance projects?",
    answer:
      "Yes, I'm available for freelance projects. I can help with full-stack web development, frontend development, backend development, and technical consulting. Feel free to reach out to discuss your project requirements.",
  },
  {
    question: "What is your development process?",
    answer:
      "My development process typically involves understanding requirements, planning the architecture, developing iteratively with regular feedback, testing thoroughly, and deploying with proper documentation. I believe in clean code, best practices, and delivering high-quality solutions.",
  },
  {
    question: "How long does it typically take to complete a project?",
    answer:
      "Project timelines vary depending on complexity, features, and requirements. A simple website might take 1-2 weeks, while a complex web application could take 2-3 months or more. I always provide detailed timelines during the planning phase.",
  },
  {
    question: "Do you provide ongoing maintenance and support?",
    answer:
      "Yes, I offer ongoing maintenance and support services. This includes bug fixes, feature updates, security patches, performance optimization, and technical support. We can discuss maintenance packages that fit your needs.",
  },
  {
    question: "What makes your portfolio different?",
    answer:
      "My portfolio features an interactive terminal interface that showcases not just my projects, but also my technical skills and creativity. It demonstrates my ability to create unique user experiences and my passion for innovative web development.",
  },
  {
    question: "Can you work with existing codebases?",
    answer:
      "Absolutely! I have experience working with existing codebases, legacy systems, and team environments. I can help refactor, improve, or extend existing applications while maintaining code quality and following best practices.",
  },
  {
    question: "What is your approach to responsive design?",
    answer:
      "I prioritize mobile-first responsive design to ensure optimal user experience across all devices. I use modern CSS techniques, flexible layouts, and thorough testing to create websites that work seamlessly on desktop, tablet, and mobile devices.",
  },
];

/**
 * FAQ component specifically for developer services
 * @returns {JSX.Element} The FAQ component
 */
export function DeveloperFAQ(): JSX.Element {
  return (
    <FAQ
      title="Developer Services FAQ"
      items={CommonFAQItems}
      className="max-w-4xl mx-auto"
    />
  );
}
