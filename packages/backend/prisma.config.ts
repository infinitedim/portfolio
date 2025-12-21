import path from "node:path";
import fs from "node:fs";
import { defineConfig } from "prisma/config";
import process from "node:process";

// Try to load .env file from project root (for local development)
// In CI/CD, environment variables are provided directly
const envPath = path.join(__dirname, "./.env");
if (fs.existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      console.log(error.message);
      throw new Error(
        "Env path file not found. Please make sure your .env file is there",
      );
    }
  }
}

// DIRECT_URL is used for migrations (direct connection, not pooled)
// DATABASE_URL is used for runtime queries (can be pooled)
const directUrl = process.env.DIRECT_URL;
// const databaseUrl = process.env.DATABASE_URL;

if (!directUrl) {
  throw new Error(
    "DIRECT_URL environment variable is required for Prisma migrations. " +
      "Please set it in your .env file or environment.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DIRECT_URL for migrations (non-pooled connection required)
    url: directUrl,
  },
});
