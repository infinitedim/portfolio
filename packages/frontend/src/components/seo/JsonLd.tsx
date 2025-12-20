"use client";

import { type JSX } from "react";

/**
 * Props for the JsonLd component
 * @interface JsonLdProps
 * @property {Record<string, unknown>} data - The structured data object to be rendered as JSON-LD
 * @property {"application/ld+json" | "application/json"} [type] - MIME type for the script tag
 */
interface JsonLdProps {
  data: Record<string, unknown>;
  type?: "application/ld+json" | "application/json";
}

/**
 * JSON-LD component for embedding structured data
 * Renders schema.org structured data for search engine optimization
 * @param {JsonLdProps} props - Component props
 * @param {Record<string, unknown>} props.data - The structured data object
 * @param {"application/ld+json" | "application/json"} [props.type] - MIME type (default: "application/ld+json")
 * @returns {JSX.Element} A script tag containing the JSON-LD structured data
 * @example
 * ```tsx
 * <JsonLd data={{
 *   "@context": "https://schema.org",
 *   "@type": "Person",
 *   "name": "John Doe"
 * }} />
 * ```
 */
export function JsonLd({
  data,
  type = "application/ld+json",
}: JsonLdProps): JSX.Element {
  return (
    <script
      type={type}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 2),
      }}
    />
  );
}

/**
 * Person schema for developer portfolio
 * @param {object} props - The props for the PersonSchema component.
 * @param {string} props.name - The name of the person.
 * @param {string} props.url - The URL of the person.
 * @param {string} [props.image] - The image of the person.
 * @param {string} [props.jobTitle] - The job title of the person.
 * @param {string} [props.description] - The description of the person.
 * @param {string[]} [props.sameAs] - The sameAs of the person.
 * @param {string[]} [props.knowsAbout] - The knowsAbout of the person.
 * @param {string} [props.worksFor] - The worksFor of the person.
 * @returns {JSX.Element} The Person schema
 */
export function PersonSchema({
  name,
  url,
  image,
  jobTitle,
  description,
  sameAs,
  knowsAbout,
  worksFor,
}: {
  name: string;
  url: string;
  image?: string;
  jobTitle?: string;
  description?: string;
  sameAs?: string[];
  knowsAbout?: string[];
  worksFor?: string;
}): JSX.Element {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url,
    ...(image && { image }),
    ...(jobTitle && { jobTitle }),
    ...(description && { description }),
    ...(sameAs && { sameAs }),
    ...(knowsAbout && { knowsAbout }),
    ...(worksFor && {
      worksFor: {
        "@type": "Organization",
        name: worksFor,
      },
    }),
  };

  return <JsonLd data={data} />;
}

/**
 * WebSite schema
 * @param {object} props - The props for the WebSiteSchema component.
 * @param {string} props.name - The name of the website.
 * @param {string} props.url - The URL of the website.
 * @param {string} [props.description] - The description of the website.
 * @param {string} [props.author] - The author of the website.
 * @param {object} [props.potentialAction] - The potentialAction of the website.
 * @param {string} [props.potentialAction.target] - The target of the potentialAction.
 * @param {string} [props.potentialAction.queryInput] - The queryInput of the potentialAction.
 * @returns {JSX.Element} The WebSite schema
 */
export function WebSiteSchema({
  name,
  url,
  description,
  author,
  potentialAction,
}: {
  name: string;
  url: string;
  description?: string;
  author?: string;
  potentialAction?: {
    target: string;
    queryInput: string;
  };
}): JSX.Element {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    ...(description && { description }),
    ...(author && {
      author: {
        "@type": "Person",
        name: author,
      },
    }),
    ...(potentialAction && {
      potentialAction: {
        "@type": "SearchAction",
        target: potentialAction.target,
        "query-input": potentialAction.queryInput,
      },
    }),
  };

  return <JsonLd data={data} />;
}

/**
 * SoftwareApplication schema for projects
 * @param {object} props - The props for the SoftwareApplicationSchema component.
 * @param {string} props.name - The name of the software application.
 * @param {string} props.description - The description of the software application.
 * @param {string} [props.applicationCategory] - The applicationCategory of the software application.
 * @param {string} [props.operatingSystem] - The operatingSystem of the software application.
 * @param {object} [props.offers] - The offers of the software application.
 * @param {string} [props.offers.price] - The price of the offers.
 * @param {string} [props.offers.priceCurrency] - The priceCurrency of the offers.
 * @param {string} [props.author] - The author of the software application.
 * @param {string} [props.creator] - The creator of the software application.
 * @param {string} [props.keywords] - The keywords of the software application.
 * @param {string} [props.url] - The URL of the software application.
 * @param {string} [props.image] - The image of the software application.
 * @returns {JSX.Element} The SoftwareApplication schema
 */
export function SoftwareApplicationSchema({
  name,
  description,
  applicationCategory,
  operatingSystem,
  offers,
  author,
  creator,
  keywords,
  url,
  image,
}: {
  name: string;
  description: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
  author?: string;
  creator?: string;
  keywords?: string;
  url?: string;
  image?: string;
}): JSX.Element {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    ...(applicationCategory && { applicationCategory }),
    ...(operatingSystem && { operatingSystem }),
    ...(offers && {
      offers: {
        "@type": "Offer",
        price: offers.price,
        priceCurrency: offers.priceCurrency,
      },
    }),
    ...(author && {
      author: {
        "@type": "Person",
        name: author,
      },
    }),
    ...(creator && {
      creator: {
        "@type": "Person",
        name: creator,
      },
    }),
    ...(keywords && { keywords }),
    ...(url && { url }),
    ...(image && { image }),
  };

  return <JsonLd data={data} />;
}

/**
 * Organization schema
 * @param {object} props - The props for the OrganizationSchema component.
 * @param {string} props.name - The name of the organization.
 * @param {string} props.url - The URL of the organization.
 * @param {string} [props.logo] - The logo of the organization.
 * @param {string} [props.description] - The description of the organization.
 * @param {object} [props.address] - The address of the organization.
 * @param {string} [props.address.streetAddress] - The streetAddress of the address.
 * @param {string} [props.address.addressLocality] - The addressLocality of the address.
 * @param {string} [props.address.addressRegion] - The addressRegion of the address.
 * @param {string} [props.address.postalCode] - The postalCode of the address.
 * @param {string} [props.address.addressCountry] - The addressCountry of the address.
 * @param {object} [props.contactPoint] - The contactPoint of the organization.
 * @param {string} [props.contactPoint.telephone] - The telephone of the contactPoint.
 * @param {string} [props.contactPoint.contactType] - The contactType of the contactPoint.
 * @param {string} [props.contactPoint.email] - The email of the contactPoint.
 * @returns {JSX.Element} The Organization schema
 */
export function OrganizationSchema({
  name,
  url,
  logo,
  description,
  address,
  contactPoint,
}: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  contactPoint?: {
    telephone: string;
    contactType: string;
    email?: string;
  };
}): JSX.Element {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    ...(logo && { logo }),
    ...(description && { description }),
    ...(address && {
      address: {
        "@type": "PostalAddress",
        ...address,
      },
    }),
    ...(contactPoint && {
      contactPoint: {
        "@type": "ContactPoint",
        ...contactPoint,
      },
    }),
  };

  return <JsonLd data={data} />;
}

/**
 * BreadcrumbList schema
 * @param {object} props - The props for the BreadcrumbListSchema component.
 * @param {Array<{name: string, item: string}>} props.items - The items of the breadcrumb list.
 * @returns {JSX.Element} The BreadcrumbList schema
 */
export function BreadcrumbListSchema({
  items,
}: {
  items: Array<{
    name: string;
    item: string;
  }>;
}): JSX.Element {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };

  return <JsonLd data={data} />;
}

/**
 * FAQPage schema
 * @param {object} props - The props for the FAQPageSchema component.
 * @param {Array<{question: string, answer: string}>} props.questions - The questions of the FAQ page.
 * @returns {JSX.Element} The FAQPage schema
 */
export function FAQPageSchema({
  questions,
}: {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}): JSX.Element {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return <JsonLd data={data} />;
}

/**
 * Article schema for blog posts
 * @param {object} props - The props for the ArticleSchema component.
 * @param {string} props.headline - The headline of the article.
 * @param {string} props.description - The description of the article.
 * @param {string} props.author - The author of the article.
 * @param {string} props.publisher - The publisher of the article.
 * @param {string} props.datePublished - The datePublished of the article.
 * @param {string} [props.dateModified] - The dateModified of the article.
 * @param {string} [props.image] - The image of the article.
 * @param {string} [props.url] - The URL of the article.
 * @param {string} [props.keywords] - The keywords of the article.
 * @returns {JSX.Element} The Article schema
 */
export function ArticleSchema({
  headline,
  description,
  author,
  publisher,
  datePublished,
  dateModified,
  image,
  url,
  keywords,
}: {
  headline: string;
  description: string;
  author: string;
  publisher: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url?: string;
  keywords?: string;
}): JSX.Element {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: publisher,
    },
    datePublished,
    ...(dateModified && { dateModified }),
    ...(image && { image }),
    ...(url && { url }),
    ...(keywords && { keywords }),
  };

  return <JsonLd data={data} />;
}
