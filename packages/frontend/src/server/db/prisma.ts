import { PrismaClient } from "../../../node_modules/.prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Environment variables
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Connection pool configuration
const poolConfig = {
  connectionString: DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || "10", 10),
  min: parseInt(process.env.DB_POOL_MIN || "2", 10),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || "30000", 10),
  connectionTimeoutMillis: parseInt(
    process.env.DB_POOL_ACQUIRE_TIMEOUT || "10000",
    10,
  ),
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
};

// Global pool instance
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);

    // Pool event handlers
    pool.on("error", (err) => {
      console.error("[Prisma Pool] Unexpected error:", err.message);
    });

    pool.on("connect", () => {
      console.log("[Prisma Pool] New client connected");
    });
  }
  return pool;
}

// Prisma client singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const poolInstance = getPool();
  const adapter = new PrismaPg(poolInstance);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Utility functions
export async function testDatabaseConnection(): Promise<{
  connected: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      connected: true,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      connected: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getDatabaseInfo(): Promise<{
  version: string;
  database: string;
  user: string;
}> {
  const result = await prisma.$queryRaw<
    Array<{
      version: string;
      database: string;
      user: string;
    }>
  >`
    SELECT
      version() as version,
      current_database() as database,
      current_user as user
  `;
  return result[0];
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  if (pool) {
    await pool.end();
    pool = null;
  }
}

