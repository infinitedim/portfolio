"use client";

import { memo, useMemo, JSX } from "react";
import { useTheme } from "@/hooks/useTheme";

/**
 * ASCII banner component for the terminal portfolio
 * Displays a stylized terminal portfolio logo in ASCII art with responsive sizing
 * Features both desktop and mobile-optimized versions
 * @returns {JSX.Element} The ASCII banner component
 * @example
 * ```tsx
 * <ASCIIBanner />
 * ```
 */
export const ASCIIBanner = memo(function ASCIIBanner(): JSX.Element {
  const { themeConfig, theme } = useTheme();

  const banner = useMemo(
    () => `
  ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗
  ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║
     ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║
     ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║
     ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗
     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝

  ██████╗  ██████╗ ██████╗ ████████╗███████╗ ██████╗ ██╗     ██╗ ██████╗
  ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██║     ██║██╔═══██╗
  ██████╔╝██║   ██║██████╔╝   ██║   █████╗  ██║   ██║██║     ██║██║   ██║
  ██╔═══╝ ██║   ██║██╔══██╗   ██║   ██╔══╝  ██║   ██║██║     ██║██║   ██║
  ██║     ╚██████╔╝██║  ██║   ██║   ██║     ╚██████╔╝███████╗██║╚██████╔╝
  ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ `,
    [],
  );

  const simpleBanner = useMemo(
    () => `
  ████████ ████████ ██████  ██   ██ ██ ██   ██  █████  ██
     ██    ██       ██   ██ ██   ██ ██ ██   ██ ██   ██ ██
     ██    ██████   ██████  ███████ ██ ███████ ███████ ██
     ██    ██       ██   ██ ██   ██ ██ ██   ██ ██   ██ ██
     ██    ████████ ██   ██ ██   ██ ██ ██   ██ ██   ██ ███████

  ██████  ██████  ██████  ████████ ███████  ██████  ██      ██  ██████
  ██   ██ ██    ██ ██   ██    ██    ██      ██    ██ ██      ██ ██    ██
  ██████  ██    ██ ██████     ██    █████   ██    ██ ██      ██ ██    ██
  ██      ██    ██ ██   ██    ██    ██      ██    ██ ██      ██ ██    ██
  ██       ██████  ██   ██    ██    ██       ██████  ███████ ██  ██████  `,
    [],
  );

  const bannerStyles = useMemo(
    () => ({
      color: themeConfig.colors.accent,
      fontFamily: "JetBrains Mono, Consolas, 'Courier New', monospace",
      fontSize: "clamp(8px, 1.5vw, 12px)",
      lineHeight: "1.1",
      letterSpacing: "-0.05em",
    }),
    [themeConfig.colors.accent],
  );

  const subtitleStyles = useMemo(
    () => ({
      color: themeConfig.colors.muted,
    }),
    [themeConfig.colors.muted],
  );

  return (
    <div
      className="select-none mb-6 w-full overflow-hidden"
      key={`ascii-banner-${theme}`}
    >
      { }
      <div className="hidden sm:block">
        <pre
          style={bannerStyles}
          className="whitespace-pre text-center w-full"
        >
          {banner}
        </pre>
      </div>

      { }
      <div className="block sm:hidden">
        <pre
          style={{ ...bannerStyles, fontSize: "7px" }}
          className="whitespace-pre text-center w-full"
        >
          {simpleBanner}
        </pre>
      </div>

      { }
      <div className="text-center mt-6 space-y-2 px-4">
        <div
          style={{ color: themeConfig.colors.accent }}
          className="text-sm font-mono"
        >
          Interactive Developer Portfolio
        </div>
        <div
          style={subtitleStyles}
          className="text-xs opacity-75 font-mono"
        >
          Type 'help' to explore • Tab for completion • 'themes' to customize
        </div>
      </div>

      { }
      <div className="mt-6 mb-4 px-4">
        <div
          className="h-px w-full opacity-30"
          style={{ backgroundColor: themeConfig.colors.border }}
        />
      </div>
    </div>
  );
});
