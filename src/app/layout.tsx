import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { NextFontWithVariable } from "next/dist/compiled/@next/font";
import React, { type JSX } from "react";

const inter: NextFontWithVariable = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Your portfolio description",
};

/**
 * Root layout component for the application.
 * @param {object} root0 - The props object.
 * @param {React.ReactNode} root0.children - The child components to render inside the layout.
 * @returns {JSX.Element} The rendered layout component.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html >
  );
}
