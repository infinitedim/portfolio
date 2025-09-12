"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
  type ThemeProviderProps,
} from "next-themes";

/**
 * Hook to use the theme context from next-themes
 * @returns {object} The theme context value
 * @throws {Error} If used outside of ThemeProvider
 */
export function useThemeContext() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  return {
    theme: theme || "system",
    setTheme,
    resolvedTheme,
  };
}

/**
 * A wrapper around `next-themes`'s `ThemeProvider` to provide theme switching functionality.
 *
 * This component integrates the `next-themes` library to handle theme management,
 * including light/dark modes and system theme preference. It also bridges with our
 * custom terminal theme system for seamless integration.
 * @param {ThemeProviderProps} props - The properties for the ThemeProvider component. It accepts all props from the original `next-themes` ThemeProvider.
 * @returns {React.JSX.Element} The `NextThemesProvider` wrapping the application's children.
 * @example
 * ```tsx
 * // In app/layout.tsx
 * import { ThemeProvider } from "@/components/theme-provider";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en" suppressHydrationWarning>
 *       <body>
 *         <ThemeProvider
 *           attribute="class"
 *           defaultTheme="system"
 *           enableSystem
 *         >
 *           {children}
 *         </ThemeProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps): React.JSX.Element {
  return (
    <NextThemesProvider
      {...props}
      storageKey="terminal-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
