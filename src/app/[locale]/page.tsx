import { PageTransition } from "@/components/molecules";
import { About, Hero } from "@/components/organisms";
import type { JSX } from "react";

/**
 * Home component
 * @returns {JSX.Element} The rendered Hero component wrapped in a fragment.
 */
export default function Home(): JSX.Element {
  return (
    <PageTransition>
      <Hero />
      <About />
    </PageTransition>
  );
}
