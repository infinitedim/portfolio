import { Hero } from "@/components/organisms";
import type { JSX } from "react";

/**
 * Home component
 * @returns {JSX.Element} The rendered Hero component wrapped in a fragment.
 */
export default function Home(): JSX.Element {
  return (
    <>
      <Hero />
    </>
  );
}
