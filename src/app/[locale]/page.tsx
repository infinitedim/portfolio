import { PageTransition } from "@/components/molecules";
import { Hero } from "@/components/organisms";
import type { JSX } from "react";

/**
 * Home component
 * @returns {JSX.Element} The rendered Hero component wrapped in a fragment.
 */
export default function Home(): JSX.Element {
  return (
    <div className="bg-woodsmoke-50 dark:bg-woodsmoke-900">
      <PageTransition>
        <Hero />
      </PageTransition>
    </div>
  );
}
