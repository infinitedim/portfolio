"use client";

import type { JSX } from "react";
// import { useTranslations } from "next-intl";

/**
 * Renders the BlogPage component.
 * @returns {JSX.Element} The rendered BlogPage component.
 */
export default function BlogPage(): JSX.Element {
  // const t = useTranslations();

  return (
    <div className="min-h-screen py-16">
      <h1 className="text-4xl font-bold mb-8">Blog Page</h1>
      <p className="text-lg mb-4">Ini adalah halaman blog terpisah.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        {/* Contoh artikel blog */}
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h2 className="text-xl font-bold mb-2">Artikel Blog #{item}</h2>
            <p className="text-gray-600 mb-4">
              Ini adalah contoh artikel blog. Klik untuk membacanya.
            </p>
            <a
              href={`/blog/${item}`}
              className="text-blue-500 hover:underline"
            >
              Baca selengkapnya →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
