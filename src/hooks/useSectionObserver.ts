"use client";

import { useEffect, useState } from "react";
import { createNavigation } from "next-intl/navigation";

interface Section {
  id: string;
  ref: React.RefObject<HTMLElement>;
}

/**
 * A custom hook to observe sections and manage active section state.
 * @param {Section[]} sections - An array of section objects containing an id and a ref to the section element.
 * @returns {{ activeSection: string | null, scrollToSection: (sectionId: string) => void }} - The active section id and a function to scroll to a specific section.
 */
export function useSectionObserver(sections: Section[]): {
  activeSection: string | null;
  scrollToSection: (sectionId: string) => void;
} {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { usePathname } = createNavigation();

  const [isScrolling, setIsScrolling] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection(null);
    } else {
      const hash = window.location.hash.replace("#", "") || "home";
      setActiveSection(hash);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") return;

    const observerOptions = {
      threshold: 0.4,
      rootMargin: "-80px 0px -80px 0px",
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      if (isScrolling) return; // Abaikan pembaruan selama scroll terprogram

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          setActiveSection(sectionId);

          // Update URL hanya jika scroll manual (bukan dari navigasi klik)
          if (!isScrolling) {
            const newUrl = sectionId === "home" ? "/" : `/#${sectionId}`;

            window.history.replaceState({}, "", newUrl);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    // Observe semua section
    sections.forEach((section) => {
      if (section.ref.current) {
        observer.observe(section.ref.current);
      }
    });

    // Cleanup
    return () => {
      sections.forEach((section) => {
        if (section.ref.current) {
          observer.unobserve(section.ref.current);
        }
      });
    };
  }, [sections, isScrolling, pathname]);

  // Fungsi untuk scroll ke section yang ditentukan
  const scrollToSection = (sectionId: string) => {
    const targetSection = sections.find((section) => section.id === sectionId);
    if (!targetSection?.ref.current) return;

    setIsScrolling(true);

    // Update URL
    const newUrl = sectionId === "home" ? "/" : `/#${sectionId}`;
    window.history.pushState({}, "", newUrl);

    // Lakukan scroll
    targetSection.ref.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    // Set section aktif
    setActiveSection(sectionId);

    // Reset flag isScrolling setelah animasi scroll selesai
    setTimeout(() => {
      setIsScrolling(false);
    }, 1000); // Perkirakan durasi smooth scroll
  };

  return {
    activeSection,
    scrollToSection,
  };
}
