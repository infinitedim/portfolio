import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/prisma/migrations/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "**/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
        "**/dist/**",
        "**/prisma/**",
        "**/.next/**",
        "**/public/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@portfolio/backend": resolve(__dirname, "./packages/backend/src"),
      "@portfolio/frontend": resolve(__dirname, "./packages/frontend/src"),
      "@portfolio/logger": resolve(__dirname, "./tools/logger/src"),
      "@portfolio/trpc": resolve(__dirname, "./tools/trpc/src"),
      "@portfolio/ui": resolve(__dirname, "./packages/ui/src"),
    },
  },
});
