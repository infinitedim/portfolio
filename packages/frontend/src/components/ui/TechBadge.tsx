"use client";

import { JSX, useState } from "react";

interface TechBadgeProps {
  technology: string;
  count?: number;
  onClick?: (tech: string) => void;
  selected?: boolean;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
}

const TECH_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  // Frontend
  React: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  Vue: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-500/30",
  },
  Angular: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
  },
  "Next.js": {
    bg: "bg-black/20",
    text: "text-gray-300",
    border: "border-gray-500/30",
  },
  TypeScript: {
    bg: "bg-blue-600/20",
    text: "text-blue-400",
    border: "border-blue-600/30",
  },
  JavaScript: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
  },
  HTML: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    border: "border-orange-500/30",
  },
  CSS: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  "Tailwind CSS": {
    bg: "bg-cyan-500/20",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
  },
  Sass: {
    bg: "bg-pink-500/20",
    text: "text-pink-400",
    border: "border-pink-500/30",
  },

  // Backend
  "Node.js": {
    bg: "bg-green-600/20",
    text: "text-green-400",
    border: "border-green-600/30",
  },
  Express: {
    bg: "bg-gray-500/20",
    text: "text-gray-300",
    border: "border-gray-500/30",
  },
  Python: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  Django: {
    bg: "bg-green-700/20",
    text: "text-green-400",
    border: "border-green-700/30",
  },
  Flask: {
    bg: "bg-gray-400/20",
    text: "text-gray-300",
    border: "border-gray-400/30",
  },
  Java: {
    bg: "bg-red-600/20",
    text: "text-red-400",
    border: "border-red-600/30",
  },
  Spring: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-500/30",
  },
  "C#": {
    bg: "bg-purple-600/20",
    text: "text-purple-400",
    border: "border-purple-600/30",
  },
  ".NET": {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  PHP: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  Laravel: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
  },

  // Databases
  MongoDB: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-500/30",
  },
  PostgreSQL: {
    bg: "bg-blue-600/20",
    text: "text-blue-400",
    border: "border-blue-600/30",
  },
  MySQL: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  Redis: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
  },
  SQLite: {
    bg: "bg-blue-400/20",
    text: "text-blue-300",
    border: "border-blue-400/30",
  },

  // Cloud & DevOps
  AWS: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    border: "border-orange-500/30",
  },
  Docker: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  Kubernetes: {
    bg: "bg-blue-600/20",
    text: "text-blue-400",
    border: "border-blue-600/30",
  },
  Git: {
    bg: "bg-orange-600/20",
    text: "text-orange-400",
    border: "border-orange-600/30",
  },
  GitHub: {
    bg: "bg-gray-800/20",
    text: "text-gray-300",
    border: "border-gray-800/30",
  },
  Vercel: {
    bg: "bg-black/20",
    text: "text-gray-300",
    border: "border-gray-500/30",
  },
  Netlify: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-500/30",
  },
  Heroku: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },

  // Mobile
  "React Native": {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  Flutter: {
    bg: "bg-blue-400/20",
    text: "text-blue-300",
    border: "border-blue-400/30",
  },
  Swift: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    border: "border-orange-500/30",
  },
  Kotlin: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },

  // Testing
  Vitest: {
    bg: "bg-green-600/20",
    text: "text-green-400",
    border: "border-green-600/30",
  },
  Cypress: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-500/30",
  },
  Playwright: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },

  // Tools & Libraries
  Webpack: {
    bg: "bg-blue-600/20",
    text: "text-blue-400",
    border: "border-blue-600/30",
  },
  Vite: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  ESLint: {
    bg: "bg-purple-600/20",
    text: "text-purple-400",
    border: "border-purple-600/30",
  },
  Prettier: {
    bg: "bg-gray-500/20",
    text: "text-gray-300",
    border: "border-gray-500/30",
  },
  Storybook: {
    bg: "bg-pink-500/20",
    text: "text-pink-400",
    border: "border-pink-500/30",
  },
};

const SIZE_CLASSES = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
};

/**
 * TechBadge component
 * @param {TechBadgeProps} props - The props for the TechBadge component
 * @param {string} props.technology - The technology to display
 * @param {number} props.count - The count of the technology
 * @param {Function} props.onClick - The function to call when the TechBadge is clicked
 * @param {boolean} props.selected - Whether the TechBadge is selected
 * @param {boolean} props.interactive - Whether the TechBadge is interactive
 * @param {"sm" | "md" | "lg"} props.size - The size of the TechBadge
 * @returns {JSX.Element} The TechBadge component
 */
export function TechBadge({
  technology,
  count,
  onClick,
  selected = false,
  interactive = false,
  size = "md",
}: TechBadgeProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false);

  const techKey =
    Object.keys(TECH_COLORS).find(
      (key) => key.toLowerCase() === technology.toLowerCase(),
    ) || technology;

  const colors = TECH_COLORS[techKey] || {
    bg: "bg-gray-500/20",
    text: "text-gray-300",
    border: "border-gray-500/30",
  };

  const baseClasses = [
    "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-200",
    SIZE_CLASSES[size],
    colors.bg,
    colors.text,
    colors.border,
  ];

  const interactiveClasses = interactive
    ? [
        "cursor-pointer hover:scale-105 hover:shadow-lg",
        selected
          ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900"
          : "",
      ]
    : [];

  const hoverClasses = isHovered && interactive ? "shadow-lg scale-105" : "";

  const handleClick = () => {
    if (interactive && onClick) {
      onClick(technology);
    }
  };

  return (
    <span
      className={[...baseClasses, ...interactiveClasses, hoverClasses].join(
        " ",
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <span className="font-mono">{technology}</span>
      {count !== undefined && (
        <span className="ml-1 rounded-full bg-gray-600/50 px-1.5 py-0.5 text-xs font-bold">
          {count}
        </span>
      )}
    </span>
  );
}
