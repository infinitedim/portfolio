import path from "node:path";
import { defineConfig, type PrismaConfig } from "@prisma/config";

/**
 * Prisma Configuration for Portfolio Backend (Prisma 7+)
 *
 * This configuration file manages database connection URLs for migrations
 * and other Prisma CLI operations.
 *
 * @see https://pris.ly/d/config-datasource
 * @see https://pris.ly/d/prisma7-client-config
 */
export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "schema.prisma"),
  migrate: {
    url: process.env.DATABASE_URL!,
  },
} as PrismaConfig);
