"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/utils";
import { memo } from "react";

interface SocialLink {
  href: string;
  label: string;
  delay?: number;
}

const socialLinks: SocialLink[] = [
  { href: "https://github.com/infinitedim", label: "GitHub", delay: 0.1 },
  { href: "https://twitter.com/yourbloo", label: "Twitter", delay: 0.2 },
  {
    href: "https://linkedin.com/in/infinitedim",
    label: "LinkedIn",
    delay: 0.3,
  },
];

const SocialLinks = () => {
  return (
    <div className="mt-auto">
      <ul className="flex flex-col space-y-2">
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
              className={cn(
                "text-sm font-light text-gray-500 transition-colors duration-300 hover:text-black",
              )}
            >
              {link.label}
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

export default memo(SocialLinks);
