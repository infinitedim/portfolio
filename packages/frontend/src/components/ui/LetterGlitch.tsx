"use client";

import dynamic from "next/dynamic";
import { type JSX } from "react";

/**
 * Props for the LetterGlitch component
 * @interface LetterGlitchProps
 * @property {string[]} [glitchColors] - Array of colors for glitch effect
 * @property {number} [glitchSpeed] - Speed of the glitch animation
 * @property {boolean} [centerVignette] - Enable center vignette effect
 * @property {boolean} [outerVignette] - Enable outer vignette effect
 * @property {boolean} [smooth] - Enable smooth animation
 * @property {string} [characters] - Characters to use in animation
 * @property {string} [className] - Additional CSS classes
 */
interface LetterGlitchProps {
  glitchColors?: string[];
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  characters?: string;
  className?: string;
}

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
 * Matrix-style background effect with animated letters
 * Creates a falling characters effect similar to The Matrix movie
 * This wrapper dynamically loads the client component to prevent SSR issues
 * @param {LetterGlitchProps} props - Component props
 * @param {string[]} [props.glitchColors] - Colors for glitch effect
 * @param {number} [props.glitchSpeed] - Animation speed
 * @param {boolean} [props.centerVignette] - Center vignette
 * @param {boolean} [props.outerVignette] - Outer vignette
 * @param {boolean} [props.smooth] - Smooth animation
 * @param {string} [props.characters] - Animation characters
 * @param {string} [props.className] - Additional classes
 * @returns {JSX.Element} The letter glitch background effect
 * @example
 * ```tsx
 * <LetterGlitch
 *   glitchColors={['#00ff00', '#00aa00']}
 *   glitchSpeed={50}
 *   centerVignette={true}
 * />
 * ```
 */
export function LetterGlitch(props: LetterGlitchProps): JSX.Element {
  try {
    return <LetterGlitchClient {...props} />;
  } catch (error) {
    console.error("LetterGlitch error:", error);
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
