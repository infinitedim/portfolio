"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Logo, SettingsFAB, SocialLinks } from "@/components/atoms";
import { memo, useEffect, useState } from "react";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll(); // Check initial position
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Disable scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <header className="relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed left-0 top-0 z-40 flex w-full items-center justify-between backdrop-blur-md transition-all duration-300 ${
          scrolled
            ? "bg-white/80 dark:bg-woodsmoke-950/80 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-6 md:px-12 lg:px-16 py-4">
          <div className="flex items-center space-x-6">
            <Logo />
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center space-x-4">
              <SocialLinks />
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-900 dark:text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            <div className="relative w-6 h-6">
              <motion.span
                animate={
                  isMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }
                }
                className="absolute top-0 left-0 w-6 h-0.5 bg-current transform origin-center transition-transform"
              />
              <motion.span
                animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                className="absolute top-[10px] left-0 w-6 h-0.5 bg-current transition-opacity"
              />
              <motion.span
                animate={
                  isMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }
                }
                className="absolute bottom-0 left-0 w-6 h-0.5 bg-current transform origin-center transition-transform"
              />
            </div>
          </button>
        </div>
      </motion.div>

      {/* Full screen mobile menu */}
      <motion.div
        initial={false}
        animate={isMenuOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: "100%" }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-woodsmoke-950 p-6 md:hidden"
      >
        <div className="flex justify-end mb-10">
          <button
            onClick={() => setIsMenuOpen(false)}
            className="text-gray-900 dark:text-white focus:outline-none"
            aria-label="Close menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex justify-center mt-auto pb-10">
          <SocialLinks />
        </div>
      </motion.div>

      {/* SettingsFAB positioned at bottom right */}
      <div className="fixed bottom-6 right-6 z-40">
        <SettingsFAB />
      </div>
    </header>
  );
};

export default memo(Header);
