import path from "path";
import { fileURLToPath } from "url";

// ES Module support for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Prisma configuration for migrations and studio
 * Prisma 7.x requires datasource URLs to be configured here instead of schema.prisma
 */
export default {
  schema: path.join(__dirname, "prisma/schema.prisma"),

  migrate: {
    async datasourceUrl() {
      const url =
        process.env.DATABASE_URL_NON_POOLING ?? process.env.DATABASE_URL;

      if (!url) {
        throw new Error("DATABASE_URL is required for migrations");
      }
      return url;
    },
  },

  studio: {
    async datasourceUrl() {
      return process.env.DATABASE_URL ?? "";
    },
  },
};

