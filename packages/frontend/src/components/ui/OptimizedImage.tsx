"use client";

import { JSX, useState } from "react";
import Image from "next/image";
import { cn } from "@portfolio/frontend/src/lib/utils/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

/**
/**
OptimizedImage is a React component that renders an optimized Next.js Image
with a shimmer placeholder and graceful error handling.
 * @param {object} props - The props for the OptimizedImage component.
 * @param {string} props.src - The source URL of the image.
 * @param {string} props.alt - The alt text for the image.
 * @param {number} [props.width] - The width of the image (ignored if fill is true).
 * @param {number} [props.height] - The height of the image (ignored if fill is true).
 * @param {boolean} [props.fill] - Whether the image should fill its parent container.
 * @param {boolean} [props.priority] - Whether the image should be prioritized for loading.
 * @param {string} [props.className] - Additional CSS classes for the image container.
 * @param {string} [props.sizes] - The sizes attribute for responsive images.
 * @returns {JSX.Element} The rendered image or a fallback if loading fails.
 */
export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  fill = false,
  priority = false,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: OptimizedImageProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 dark:bg-gray-800",
          className,
        )}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <span className="text-4xl">🖼️</span>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Image not available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative", className)}
      style={!fill ? { width, height } : undefined}
    >
      <Image
        src={src}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        priority={priority}
        sizes={sizes}
        className={cn(
          "duration-700 ease-in-out",
          isLoading
            ? "scale-110 blur-2xl grayscale"
            : "scale-100 blur-0 grayscale-0",
          fill ? "object-cover" : "",
        )}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        placeholder="blur"
        blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`}
      />
    </div>
  );
}
