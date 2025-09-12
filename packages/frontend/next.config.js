/* eslint-disable no-undef */
import bundleAnalyzer from "@next/bundle-analyzer";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client"],
  experimental: {
    optimizePackageImports: ["@/components", "@/hooks", "@/lib"],
    webpackBuildWorker: true,
    // optimizeCss: true,
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Webpack optimizations for production
  webpack: (config, { dev, isServer, webpack }) => {
    // Performance optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: "vendor",
              chunks: "all",
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: "common",
              chunks: "all",
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Terminal specific chunks
            terminal: {
              name: "terminal",
              chunks: "all",
              test: /[\\/]src[\\/]components[\\/]terminal[\\/]/,
              priority: 30,
            },
            // Theme system chunks
            themes: {
              name: "themes",
              chunks: "all",
              test: /[\\/]src[\\/](lib|components)[\\/](themes|customization)[\\/]/,
              priority: 25,
            },
          },
        },
        // Bundle analyzer is handled by withBundleAnalyzer
      };
    }

    // Add webpack plugins for development
    if (dev) {
      config.plugins.push(
        new webpack.DefinePlugin({
          __DEV__: JSON.stringify(true),
        }),
      );
    }

    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            typescript: true,
            dimensions: false,
          },
        },
      ],
    });

    return config;
  },

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

  // Public runtime config
  publicRuntimeConfig: {
    APP_ENV: process.env.NODE_ENV,
    ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true",
  },

  // Server runtime config
  serverRuntimeConfig: {
    SECRET: process.env.SECRET_KEY,
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

  // ESLint configuration
  eslint: {
    // Disable ESLint during builds (handled by CI/CD)
    ignoreDuringBuilds: true,
    dirs: ["src", "components", "hooks", "lib"],
  },

  // TypeScript configuration
  typescript: {
    // Disable type checking during builds (handled by CI/CD)
    ignoreBuildErrors: true,
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
            key: "X-XSS-Protection",
            value: "1; mode=block",
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
