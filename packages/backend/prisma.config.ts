import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Explicitly load .env file from project root
try {
  process.loadEnvFile(path.join(__dirname, "../../.env"));
} catch (e) {
  // Ignore error if .env file does not exist
  console.log(e);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL") || env("DATABASE_URL"),
  },
});
