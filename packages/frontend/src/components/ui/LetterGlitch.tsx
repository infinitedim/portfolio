"use client";

import dynamic from "next/dynamic";
import { type JSX } from "react";

interface LetterGlitchProps {
  glitchColors?: string[];
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  characters?: string;
  className?: string;
}

// Dynamically import the client-side component with no SSR and better error handling
const LetterGlitchClient = dynamic(() => import("./LetterGlitchClient"), {
  ssr: false,
  loading: () => (
    <canvas
      className="fixed inset-0 w-full h-full pointer-events-none opacity-20"
      style={{
        zIndex: -10,
        background: "transparent",
      }}
      aria-hidden="true"
    />
  ),
});

/**
 * LetterGlitch component that creates a matrix-style background effect
 * with animated letters scrolling vertically
 *
 * This is a wrapper that dynamically loads the actual component only on the client side
 * to prevent hydration mismatches and module resolution issues.
 */
export function LetterGlitch(props: LetterGlitchProps): JSX.Element {
  // Add error boundary-like behavior for client-side rendering
  try {
    return <LetterGlitchClient {...props} />;
  } catch (error) {
    console.error("LetterGlitch error:", error);
    // Return a fallback that won't break the page
    return (
      <div
        className={`fixed inset-0 w-full h-full pointer-events-none ${props.className || ""}`}
        style={{ zIndex: -10 }}
        aria-hidden="true"
      />
    );
  }
}

export default LetterGlitch;
