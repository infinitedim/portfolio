"use client";

import { motion } from "framer-motion";
import type { JSX } from "react";
import Link from "next/link";
import { cn } from "@/utils";
import { memo, useState, useRef, useEffect } from "react";
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
  username: string;
}

const socialLinks: SocialLink[] = [
  {
    href: "https://github.com/infinitedim",
    label: "GitHub",
    icon: <GitHubLogoIcon className="w-5 h-5" />,
    hoverColorLight: "hover:text-gray-900",
    hoverColorDark: "dark:hover:text-white",
    delay: 0.1,
    username: "infinitedim",
  },
  {
    href: "https://twitter.com/yourbloo",
    label: "Twitter",
    icon: <TwitterLogoIcon className="w-5 h-5" />,
    hoverColorLight: "hover:text-blue-400",
    hoverColorDark: "dark:hover:text-blue-300",
    delay: 0.2,
    username: "yourbloo",
  },
  {
    href: "https://linkedin.com/in/infinitedim",
    label: "LinkedIn",
    icon: <LinkedInLogoIcon className="w-5 h-5" />,
    hoverColorLight: "hover:text-blue-700",
    hoverColorDark: "dark:hover:text-blue-400",
    delay: 0.3,
    username: "infinitedim",
  },
];

const SocialLinks = ({ className }: { className?: string }) => {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [textWidths, setTextWidths] = useState<Record<string, number>>({});
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const usernameRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Measure text widths after initial render
  useEffect(() => {
    const newWidths: Record<string, number> = {};

    socialLinks.forEach((link) => {
      const labelElement = labelRefs.current[link.href];
      const usernameElement = usernameRefs.current[link.href];

      if (labelElement && usernameElement) {
        // Get the wider of the two texts
        const labelWidth = labelElement.offsetWidth;
        const usernameWidth = usernameElement.offsetWidth;
        newWidths[link.href] = Math.max(labelWidth, usernameWidth) + 5; // Add small buffer
      }
    });

    setTextWidths(newWidths);
  }, []);

  return (
    <div className={cn("mt-auto", className)}>
      <ul className="flex flex-row space-x-4">
        {socialLinks.map((link) => (
          <motion.li
            key={link.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: link.delay }}
            onHoverStart={() => setHoveredLink(link.href)}
            onHoverEnd={() => setHoveredLink(null)}
          >
            <Link
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className={cn(
                "text-gray-700 dark:text-gray-300 transition-colors duration-300 flex items-center gap-x-[4px]",
                link.hoverColorLight,
                link.hoverColorDark,
              )}
            >
              {link.icon}
              <div
                className="relative h-5 overflow-hidden flex items-center text-sm"
                style={{
                  width: textWidths[link.href]
                    ? `${textWidths[link.href]}px`
                    : "auto",
                  minWidth: "60px", // Fallback minimum width
                }}
              >
                <div className="flex flex-col relative w-full">
                  <motion.div
                    ref={(el) => {
                      labelRefs.current[link.href] = el;
                    }}
                    className="whitespace-nowrap"
                    animate={{
                      y: hoveredLink === link.href ? -20 : 0,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeInOut",
                    }}
                  >
                    {link.label}
                  </motion.div>
                  <motion.div
                    ref={(el) => {
                      usernameRefs.current[link.href] = el;
                    }}
                    className="whitespace-nowrap absolute top-0"
                    initial={{ y: 20 }}
                    animate={{
                      y: hoveredLink === link.href ? 0 : 20,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeInOut",
                    }}
                  >
                    {link.username}
                  </motion.div>
                </div>
              </div>
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

export default memo(SocialLinks);
