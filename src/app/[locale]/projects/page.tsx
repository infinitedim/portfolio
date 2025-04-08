"use client";

// import { useTranslations } from "next-intl";
import { memo, type JSX } from "react";

/**
 * Renders the ProjectsPage component.
 * @returns {JSX.Element} The rendered ProjectsPage component.
 */
function ProjectsPage(): JSX.Element {
  // const t = useTranslations();

  return (
    <div className="min-h-screen py-16">
      <h1 className="text-4xl font-bold mb-8">Projects Page</h1>
      <p className="text-lg mb-4">Ini adalah halaman proyek terpisah.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {/* Contoh proyek */}
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h2 className="text-xl font-bold mb-2">Proyek #{item}</h2>
            <p className="text-gray-600 mb-4">
              Deskripsi singkat tentang proyek ini.
            </p>
            <a
              href={`/projects/${item}`}
              className="text-blue-500 hover:underline"
            >
              Lihat detail →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(ProjectsPage);
