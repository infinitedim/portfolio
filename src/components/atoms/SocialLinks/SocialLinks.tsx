"use client";

import { motion } from "framer-motion";
import type { JSX } from "react";
import Link from "next/link";
import { cn } from "@/utils";
import { memo } from "react";
import {
  GitHubLogoIcon,
  TwitterLogoIcon,
  LinkedInLogoIcon,
} from "@radix-ui/react-icons";

interface SocialLink {
  href: string;
  label: string;
  icon: JSX.Element;
  hoverColorLight: string;
  hoverColorDark: string;
  delay?: number;
}

const socialLinks: SocialLink[] = [
  {
    href: "https://github.com/infinitedim",
    label: "GitHub",
    icon: <GitHubLogoIcon className="w-5 h-5" />,
    hoverColorLight: "hover:text-gray-900",
    hoverColorDark: "dark:hover:text-white",
    delay: 0.1,
  },
  {
    href: "https://twitter.com/yourbloo",
    label: "Twitter",
    icon: <TwitterLogoIcon className="w-5 h-5" />,
    hoverColorLight: "hover:text-blue-400",
    hoverColorDark: "dark:hover:text-blue-300",
    delay: 0.2,
  },
  {
    href: "https://linkedin.com/in/infinitedim",
    label: "LinkedIn",
    icon: <LinkedInLogoIcon className="w-5 h-5" />,
    hoverColorLight: "hover:text-blue-700",
    hoverColorDark: "dark:hover:text-blue-400",
    delay: 0.3,
  },
];

const SocialLinks = () => {
  return (
    <div className="mt-auto">
      <ul className="flex flex-row space-x-4">
        {socialLinks.map((link) => (
          <motion.li
            key={link.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: link.delay }}
          >
            <Link
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className={cn(
                "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                link.hoverColorLight,
                link.hoverColorDark,
              )}
            >
              {link.icon}
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

export default memo(SocialLinks);
