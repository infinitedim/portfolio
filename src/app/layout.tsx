// src/app/layout.tsx (Server Component)
import { Metadata, Viewport } from "next";
import { ClientRootLayout } from "@/components/templates/";
import type { JSX, ReactNode } from "react";

export const metadata: Metadata = {
  title: "Portfolio - Dimas",
  description: "Portfolio - Dimas",
  keywords: "Portfolio, Dimas, yourbloo, infinitedim",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  height: "device-height",
};

/**
 * Root layout component for the application.
 * @param {object} root0 - The props object.
 * @param {ReactNode} root0.children - The child components to render.
 * @returns {JSX.Element} The rendered layout component.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return <ClientRootLayout>{children}</ClientRootLayout>;
}
