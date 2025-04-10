"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NavigationMenu } from "@/components/molecules";
import { Logo, SettingsFAB, SocialLinks } from "@/components/atoms";
import { memo } from "react";

const Header = () => {
  const pathname = usePathname();

  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return "Home";
      case "/works":
        return "Works";
      case "/about":
        return "About";
      case "/contact":
        return "Contact";
      default:
        return "";
    }
  };

  return (
    <header className="relative">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed left-0 top-0 z-40 hidden h-screen w-[250px] flex-col border-r border-gray-100 dark:border-woodsmoke-800 bg-white dark:bg-woodsmoke-950 p-10 md:flex"
      >
        <Logo className="mb-12" />
        <NavigationMenu />
        <SocialLinks />
        <SettingsFAB className="mt-10 bg-white dark:bg-gray-900" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed left-0 top-0 z-40 flex w-full items-center justify-between border-b border-gray-100 dark:border-gray-800bg-white/80 dark:bg-gray-900/80 px-6 py-5 backdrop-blur md:hidden"
      >
        <NavigationMenu />
        <SocialLinks />
        <Logo />
        <div className="w-10" />
      </motion.div>
      <motion.div
        className="fixed left-[270px] top-10 z-30 hidden md:block"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h1 className="text-xl font-light text-gray-800 dark:text-gray-200">
          {getPageTitle()}
        </h1>
      </motion.div>
    </header>
  );
};

export default memo(Header);
