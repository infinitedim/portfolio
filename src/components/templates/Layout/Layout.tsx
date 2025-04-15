"use client";

import { type ReactNode, memo, useEffect, useState } from "react";
import { Header } from "@/components/organisms";
import { useTranslations } from "next-intl";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const locale = useTranslations("common");
  const [scrolled, setScrolled] = useState<boolean>(false);

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

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-woodsmoke-950 text-woodsmoke-950 dark:text-white">
      <div
        className={`sticky top-[60px] py-2 z-30 text-center px-4 dark:text-white text-woodsmoke-950 font-medium left-0 flex w-full justify-center items-center backdrop-blur-md transition-all duration-300 ${
          scrolled
            ? "bg-white/80 dark:bg-woodsmoke-950/80 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <p>🚧 {locale("development")} 🚧</p>
      </div>
      <Header />

      <main className="pt-32">
        <div className="container mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default memo(Layout);
