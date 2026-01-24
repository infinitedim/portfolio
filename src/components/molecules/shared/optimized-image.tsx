"use client";

import { JSX, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/utils";

/**
 * Props for the OptimizedImage component
 * @interface OptimizedImageProps
 * @property {string} src - Image source URL
 * @property {string} alt - Alternative text for accessibility
 * @property {number} [width] - Image width in pixels
 * @property {number} [height] - Image height in pixels
 * @property {boolean} [fill] - Whether image should fill container
 * @property {boolean} [priority] - Priority loading flag
 * @property {string} [className] - Additional CSS classes
 * @property {string} [sizes] - Responsive sizes attribute
 */
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
 * Optimized Next.js Image component with shimmer placeholder and error handling
 * Provides automatic loading states and graceful fallback for failed images
 * @param {OptimizedImageProps} props - Component props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text
 * @param {number} [props.width=400] - Width in pixels
 * @param {number} [props.height=300] - Height in pixels
 * @param {boolean} [props.fill=false] - Fill container
 * @param {boolean} [props.priority=false] - Priority loading
 * @param {string} [props.className] - Additional classes
 * @param {string} [props.sizes] - Responsive sizes
 * @returns {JSX.Element} The optimized image component
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   width={800}
 *   height={600}
 *   priority
 * />
 * ```
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
