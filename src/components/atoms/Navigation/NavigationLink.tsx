"use client";

import { createNavigation } from "next-intl/navigation";
import { motion } from "framer-motion";
import { cn } from "@/utils";
import { memo } from "react";

interface NavigationLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  delay?: number;
}

const NavigationLink = ({
  href,
  label,
  isActive,
  onClick,
  delay = 0,
}: NavigationLinkProps) => {
  const { useRouter } = createNavigation();

  const router = useRouter();

  const isInternalLink = href === "/" || href.startsWith("/#");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sectionId =
    href === "/" ? "home" : isInternalLink ? href.replace("/#", "") : null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (isInternalLink && onClick) {
      onClick();
    } else {
      router.push(href);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="overflow-hidden"
    >
      <motion.a
        href={href}
        onClick={handleClick}
        className={cn(
          "relative block w-full py-1 text-left transition-colors duration-300",
          isActive ? "text-black" : "text-gray-500 hover:text-black",
        )}
        whileHover={{
          x: 8,
          transition: { type: "spring", stiffness: 400, damping: 17 },
        }}
      >
        <motion.span
          className="block"
          whileHover={{
            scale: 1.05,
            originX: 0,
          }}
        >
          {label}
        </motion.span>

        {isActive && (
          <motion.span
            className="absolute bottom-0 left-0 h-px w-full bg-black"
            layoutId="underline"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </motion.a>
    </motion.div>
  );
};

export default memo(NavigationLink);
