"use client";

import { memo, useState, useEffect } from "react";
import type { JSX, ReactNode } from "react";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { LoadingScreen } from "@/components/templates";
import Provider from "@/app/provider";
import { PageTransition } from "@/components/molecules";

const inter = Inter({ subsets: ["latin"] });

/**
 * ClientRootLayout component that wraps the application with a layout.
 * @param {object} root0 - The props object.
 * @param {ReactNode} root0.children - The child components to render inside the layout.
 * @returns {JSX.Element} The rendered layout component.
 */
function ClientRootLayout({ children }: { children: ReactNode }): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // Check if this is the first visit or if it's been a day since the last visit
    const checkVisitTime = () => {
      if (typeof window !== "undefined") {
        const lastVisit = localStorage.getItem("lastVisit");
        const now = Date.now();

        // One day in milliseconds (24 hours)
        const oneDay = 86400000;

        if (!lastVisit || now - parseInt(lastVisit) > oneDay) {
          // First visit or it's been more than a day
          localStorage.setItem("lastVisit", now.toString());
          return true;
        }

        // Update the last visit time but don't show loader
        localStorage.setItem("lastVisit", now.toString());
        return false;
      }
      return true;
    };

    const shouldShowLoader = checkVisitTime();
    setShowLoader(shouldShowLoader);

    if (!shouldShowLoader) {
      // Skip loading screen if not needed
      setIsLoading(false);
    } else {
      // Show loading screen with timer
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <html lang="en">
      <body
        className={`${inter.className} ${isLoading ? "freeze-animations" : ""}`}
      >
        {showLoader && <LoadingScreen />}
        <div
          className={
            isLoading && showLoader
              ? "opacity-0"
              : "opacity-100 transition-opacity duration-500"
          }
        >
          <PageTransition>
            <Provider>{children}</Provider>
          </PageTransition>
        </div>
      </body>
    </html>
  );
}

export default memo(ClientRootLayout);
