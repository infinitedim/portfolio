"use client";

import { useTheme } from "@/hooks/use-theme";
import { type JSX, useMemo } from "react";

interface SkipToContentProps {
  targetId?: string;
  className?: string;
}

/**
 * Skip to Content link for keyboard accessibility
 * Shows when user tabs and allows jumping to main content
 * @param {SkipToContentProps} props - The props for the SkipToContent component
 * @returns {JSX.Element} The SkipToContent component
 */
export function SkipToContent({
  targetId = "main-content",
  className = "",
}: SkipToContentProps): JSX.Element {
  const { themeConfig, mounted } = useTheme();

  const resolvedTheme = useMemo(
    () => ({
      backgroundColor: (mounted && themeConfig?.colors?.accent) || "#0284c7",
      color: (mounted && themeConfig?.colors?.bg) || "#ffffff",
      borderColor: (mounted && themeConfig?.colors?.border) || "#1e293b",
    }),
    [
      mounted,
      themeConfig?.colors?.accent,
      themeConfig?.colors?.bg,
      themeConfig?.colors?.border,
    ],
  );

  const handleSkip = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!mounted) {
    return (
      <a
        href={`#${targetId}`}
        className={`sr-only focus:not-sr-only focus:absolute focus:top-16 focus:left-4 focus:z-100 px-4 py-2 rounded shadow-lg transition-all duration-200 font-mono text-sm ${className}`}
        style={{
          backgroundColor: "#0284c7",
          color: "#ffffff",
          border: "2px solid #1e293b",
        }}
        onClick={handleClick}
        onKeyDown={handleSkip}
        aria-label="Skip to main terminal content"
      >
        ⏭️ Skip to terminal
      </a>
    );
  }

  return (
    <a
      href={`#${targetId}`}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-16 focus:left-4 focus:z-100 px-4 py-2 rounded shadow-lg transition-all duration-200 font-mono text-sm ${className}`}
      style={{
        backgroundColor: resolvedTheme.backgroundColor,
        color: resolvedTheme.color,
        border: `2px solid ${resolvedTheme.borderColor}`,
      }}
      onClick={handleClick}
      onKeyDown={handleSkip}
      aria-label="Skip to main terminal content"
    >
      ⏭️ Skip to terminal
    </a>
  );
}

/**
 * Multiple skip links for complex layouts
 */
interface SkipLinksProps {
  links: Array<{
    id: string;
    label: string;
    icon?: string;
  }>;
}

/**
 * Skip links for complex layouts
 * @param {SkipLinksProps} props - The props for the SkipLinks component
 * @returns {JSX.Element} The SkipLinks component
 */
export function SkipLinks({ links }: SkipLinksProps): JSX.Element {
  const { themeConfig, mounted } = useTheme();

  const resolvedTheme = useMemo(
    () => ({
      backgroundColor: (mounted && themeConfig?.colors?.accent) || "#0284c7",
      color: (mounted && themeConfig?.colors?.bg) || "#ffffff",
    }),
    [mounted, themeConfig?.colors?.accent, themeConfig?.colors?.bg],
  );

  const handleSkipTo = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const baseStyles = {
    nav: "sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-16 focus-within:left-4 focus-within:z-[100]",
    link: "block px-4 py-2 mb-2 rounded shadow-lg transition-all duration-200 font-mono text-sm hover:opacity-80 focus:outline-none focus:ring-2",
  };

  const linkStyle = {
    backgroundColor: resolvedTheme.backgroundColor,
    color: resolvedTheme.color,
  };

  return (
    <nav
      className={baseStyles.nav}
      aria-label="Skip to content links"
    >
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className={baseStyles.link}
          style={linkStyle}
          onClick={(e) => {
            e.preventDefault();
            handleSkipTo(link.id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSkipTo(link.id);
            }
          }}
        >
          {link.icon} {link.label}
        </a>
      ))}
    </nav>
  );
}
