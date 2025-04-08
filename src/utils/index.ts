import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { compilationTracker } from "./compilationTracker";

/**
 * Combines class names using clsx and tailwind-merge.
 * @param {...ClassValue[]} inputs - The class values to be combined.
 * @returns {string} - The merged class string.
 */
function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export { cn, compilationTracker };
