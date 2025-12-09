import path from "node:path";
import fs from "node:fs";
import { defineConfig, env } from "prisma/config";

// Try to load .env file from project root (for local development)
// In CI/CD, environment variables are provided directly
const envPath = path.join(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // Silently ignore - env vars should be provided by CI/CD
  }
}

// Prisma 7 configuration
// In Prisma 7, datasource URLs should be configured here instead of schema.prisma
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
    shadowDatabaseUrl: env("DATABASE_URL"),
  },
});
