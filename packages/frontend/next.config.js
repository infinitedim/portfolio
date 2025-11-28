/* eslint-disable no-undef */
import bundleAnalyzer from "@next/bundle-analyzer";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile monorepo packages (only UI and shared packages)
  transpilePackages: ["@portfolio/ui"],
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  // Temporarily disable experimental flags while diagnosing module factory error
  experimental: {
    // optimizePackageImports: ["@/components", "@/hooks", "@/lib"],
    // webpackBuildWorker: true,
    serverActions: { bodySizeLimit: "2mb" },
  },
  turbopack: {},

  // Image optimization with Vercel
  images: {
    loader: "default",
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentDispositionType: "inline",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Compression and performance
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },


  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,

    // React refresh for development
    reactRemoveProperties: process.env.NODE_ENV === "production",

    // Styled components support if needed
    styledComponents: false,
  },

  // Output configuration for static export if needed
  // output: 'export', // Uncomment for static export
  // trailingSlash: true, // Uncomment for static export
  // distDir: 'out', // Uncomment for static export


  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Headers for security and performance
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "geolocation=(), microphone=(), camera=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
          // CSP will be handled by middleware with nonce
          ...(isDevelopment
            ? []
            : [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]),
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/:path*\\.(ico|png|jpg|jpeg|gif|webp|svg|css|js)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
      {
        source: "/terminal",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // Rewrites
  async rewrites() {
    return [
      {
        source: "/api/health",
        destination: "/api/portfolio/health",
      },
      {
        source: "/healthz",
        destination: "/api/portfolio/health",
      },
    ];
  },
};

// Bundle analyzer configuration
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
