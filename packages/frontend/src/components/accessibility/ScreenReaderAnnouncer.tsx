"use client";

import { JSX, useEffect, useRef } from "react";

interface ScreenReaderAnnouncerProps {
  message: string;
  priority?: "polite" | "assertive";
}

/**
 * A component that announces messages to screen readers.
 * It uses an ARIA live region to make dynamic content updates audible.
 * @param {ScreenReaderAnnouncerProps} props - The properties for the ScreenReaderAnnouncer component.
 * @param {string} props.message - The message to be announced.
 * @param {"polite" | "assertive"} [props.priority] - The priority of the announcement.
 * @returns {JSX.Element} - A visually hidden div that acts as an ARIA live region.
 */
export function ScreenReaderAnnouncer({
  message,
  priority = "polite",
}: ScreenReaderAnnouncerProps): JSX.Element {
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && announcerRef.current) {
      // Clear and set new message
      announcerRef.current.textContent = "";
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message;
        }
      }, 100);
    }
  }, [message]);

  return (
    <div
      ref={announcerRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    />
  );
}
