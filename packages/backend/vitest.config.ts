import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,ts}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/prisma/migrations/**",
      "**/generated/**",
      "**/logging/test/**",
      "**/dist/**/*.js",
      "**/health/test/health.service.test.ts",
      "**/prisma/test/database-connection-manager.service.test.ts",
      "**/prisma/test/prisma-connection-cleanup.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
        "**/dist/**",
        "**/prisma/**",
        "**/generated/**",
        "**/.next/**",
        "**/public/**",
      ],
    },
  },
  esbuild: {
    target: "node22",
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        target: "es2020",
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@portfolio/backend": resolve(__dirname, "./src"),
      "@portfolio/logger": resolve(__dirname, "../../tools/logger/src"),
      "@portfolio/trpc": resolve(__dirname, "../../tools/trpc/src"),
    },
  },
});
