"use client";

import { useState, useEffect } from "react";
import type { JSX, ReactNode } from "react";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { LoadingScreen } from "@/components/templates";
import Provider from "./provider";
import { PageTransition } from "@/components/molecules";

const inter = Inter({ subsets: ["latin"] });

/**
 * Root layout component for the application.
 * @param {object} root0 - The props object.
 * @param {ReactNode} root0.children - The child components to render inside the layout.
 * @returns {JSX.Element} The rendered layout component.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Remove loading state after animations complete
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500); // Set slightly longer than your loading animation

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en">
      <body className={`${inter.className} ${isLoading ? "freeze-animations" : ""}`}>
        <LoadingScreen />
        <div className={isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-500"}>
          <PageTransition>
            <Provider>
              {children}
            </Provider>
          </PageTransition>
        </div>
      </body>
    </html>
  );
}