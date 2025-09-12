import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function for conditionally joining class names, with support for Tailwind CSS.
 * @param {...ClassValue} inputs The class values to merge.
 * @returns {string} The merged class names as a string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a simple, client-side unique ID.
 * @returns {string} A unique string identifier.
 */
export function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

/**
 * Formats a given Date object or a timestamp (number) into a "YYYY-MM-DD HH:MM:SS" string.
 * @param {Date | number} dateInput The date object or timestamp to format.
 * @returns {string} The formatted date string.
 */
export function formatTimestamp(dateInput: Date | number): string {
  const date = typeof dateInput === "number" ? new Date(dateInput) : dateInput;

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
