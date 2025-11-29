/**
 * Backend Connectivity Test Script
 * Tests database (PostgreSQL) and Redis (Upstash) connections
 */

import { PrismaClient } from "@prisma/client";
import { Redis } from "@upstash/redis";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(
  message: string,
  type: "success" | "error" | "info" | "warn" = "info",
) {
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    info: `${colors.cyan}ℹ${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
  };
  console.log(`${prefix[type]} ${message}`);
}

function header(title: string) {
  console.log(
    `\n${colors.bold}${colors.cyan}═══════════════════════════════════════════${colors.reset}`,
  );
  console.log(`${colors.bold}${colors.cyan}  ${title}${colors.reset}`);
  console.log(
    `${colors.bold}${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`,
  );
}

async function testDatabaseConnection(): Promise<boolean> {
  header("Database Connection Test (PostgreSQL/Prisma)");

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    log("DATABASE_URL not configured", "error");
    return false;
  }

  // Mask the password in the URL for logging
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ":****@");
  log(`Connection URL: ${maskedUrl}`, "info");

  const prisma = new PrismaClient({
    log: ["error"],
  });

  try {
    log("Connecting to database...", "info");

    // Test basic connectivity
    const startTime = Date.now();
    const result =
      await prisma.$queryRaw`SELECT 1 as connection_test, NOW() as server_time`;
    const latency = Date.now() - startTime;

    log(`Connected successfully! (Latency: ${latency}ms)`, "success");
    log(`Server time: ${JSON.stringify(result)}`, "info");

    // Get database version
    const versionResult = await prisma.$queryRaw`SELECT version()`;
    log(`Database version: ${JSON.stringify(versionResult)}`, "info");

    // List tables in the database
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    log(`Tables in database: ${JSON.stringify(tables, null, 2)}`, "info");

    // Check if migrations table exists
    const migrationsTable = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_name = '_prisma_migrations'
    `;
    log(
      `Prisma migrations table exists: ${JSON.stringify(migrationsTable)}`,
      "info",
    );

    await prisma.$disconnect();
    log("Database connection test PASSED", "success");
    return true;
  } catch (error) {
    log(
      `Database connection FAILED: ${error instanceof Error ? error.message : String(error)}`,
      "error",
    );

    // Provide helpful hints
    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED")) {
        log(
          "Hint: Database server is not reachable. Check if the host is correct.",
          "warn",
        );
      } else if (error.message.includes("authentication")) {
        log(
          "Hint: Check your database credentials (username/password).",
          "warn",
        );
      } else if (error.message.includes("SSL")) {
        log(
          "Hint: SSL configuration might be incorrect. Try adding ?sslmode=require to the URL.",
          "warn",
        );
      }
    }

    try {
      await prisma.$disconnect();
    } catch {
      // Ignore disconnect errors
    }
    return false;
  }
}

async function testRedisConnection(): Promise<boolean> {
  header("Redis Connection Test (Upstash)");

  // Try multiple possible env variable names
  const redisUrl =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!redisUrl || !redisToken) {
    log("Redis configuration missing", "error");
    log(
      `UPSTASH_REDIS_REST_URL: ${process.env.UPSTASH_REDIS_REST_URL ? "set" : "not set"}`,
      "info",
    );
    log(
      `KV_REST_API_URL: ${process.env.KV_REST_API_URL ? "set" : "not set"}`,
      "info",
    );
    log(
      `UPSTASH_REDIS_REST_TOKEN: ${process.env.UPSTASH_REDIS_REST_TOKEN ? "set" : "not set"}`,
      "info",
    );
    log(
      `KV_REST_API_TOKEN: ${process.env.KV_REST_API_TOKEN ? "set" : "not set"}`,
      "info",
    );

    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      log("Using KV_REST_API_* environment variables instead", "warn");
    } else {
      return false;
    }
  }

  log(`Redis URL: ${redisUrl}`, "info");
  log(
    `Token: ${redisToken ? redisToken.substring(0, 10) + "..." : "not set"}`,
    "info",
  );

  try {
    const redis = new Redis({
      url: redisUrl!,
      token: redisToken!,
    });

    log("Testing Redis connection...", "info");

    // Test PING
    const startTime = Date.now();
    const pingResult = await redis.ping();
    const latency = Date.now() - startTime;

    log(`PING response: ${pingResult} (Latency: ${latency}ms)`, "success");

    // Test SET/GET
    const testKey = `test:connectivity:${Date.now()}`;
    const testValue = { timestamp: new Date().toISOString(), test: true };

    await redis.set(testKey, JSON.stringify(testValue), { ex: 60 });
    log(`SET ${testKey} = ${JSON.stringify(testValue)}`, "success");

    const getValue = await redis.get(testKey);
    log(`GET ${testKey} = ${getValue}`, "success");

    // Test INCR
    const counterKey = `test:counter:${Date.now()}`;
    await redis.set(counterKey, 0, { ex: 60 });
    const incrResult = await redis.incr(counterKey);
    log(`INCR ${counterKey} = ${incrResult}`, "success");

    // Test TTL
    const ttlResult = await redis.ttl(testKey);
    log(`TTL ${testKey} = ${ttlResult} seconds`, "info");

    // Cleanup test keys
    await redis.del(testKey);
    await redis.del(counterKey);
    log("Test keys cleaned up", "success");

    // Get some stats (if available)
    try {
      const dbSize = await redis.dbsize();
      log(`Database size (keys count): ${dbSize}`, "info");
    } catch {
      log("DBSIZE command not available (Upstash limitation)", "warn");
    }

    log("Redis connection test PASSED", "success");
    return true;
  } catch (error) {
    log(
      `Redis connection FAILED: ${error instanceof Error ? error.message : String(error)}`,
      "error",
    );

    if (error instanceof Error) {
      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("401")
      ) {
        log(
          "Hint: Check your Redis token - it might be invalid or expired.",
          "warn",
        );
      } else if (
        error.message.includes("ENOTFOUND") ||
        error.message.includes("ECONNREFUSED")
      ) {
        log("Hint: Redis URL is not reachable. Check the URL.", "warn");
      }
    }

    return false;
  }
}

async function testSupabaseConnection(): Promise<boolean> {
  header("Supabase Connection Test");

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log("Supabase configuration missing", "error");
    return false;
  }

  log(`Supabase URL: ${supabaseUrl}`, "info");
  log(`Anon Key: ${supabaseKey.substring(0, 20)}...`, "info");

  try {
    // Test Supabase REST API health
    const healthUrl = `${supabaseUrl}/rest/v1/`;
    const startTime = Date.now();

    const response = await fetch(healthUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    const latency = Date.now() - startTime;

    if (response.ok || response.status === 200) {
      log(
        `Supabase REST API reachable (Latency: ${latency}ms, Status: ${response.status})`,
        "success",
      );
    } else {
      log(
        `Supabase REST API responded with status: ${response.status}`,
        "warn",
      );
    }

    // Test auth health
    const authUrl = `${supabaseUrl}/auth/v1/health`;
    const authResponse = await fetch(authUrl);

    if (authResponse.ok) {
      const authData = await authResponse.json();
      log(`Supabase Auth service: ${JSON.stringify(authData)}`, "success");
    } else {
      log(`Supabase Auth status: ${authResponse.status}`, "warn");
    }

    log("Supabase connection test PASSED", "success");
    return true;
  } catch (error) {
    log(
      `Supabase connection FAILED: ${error instanceof Error ? error.message : String(error)}`,
      "error",
    );
    return false;
  }
}

async function main() {
  console.log(
    `\n${colors.bold}${colors.cyan}╔═══════════════════════════════════════════════════════╗${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}║     Backend Connectivity Test Suite                   ║${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}║     Testing: PostgreSQL, Redis (Upstash), Supabase    ║${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}╚═══════════════════════════════════════════════════════╝${colors.reset}`,
  );
  console.log(`\nTest started at: ${new Date().toISOString()}\n`);

  const results: Record<string, boolean> = {};

  // Test Database
  results.database = await testDatabaseConnection();

  // Test Redis
  results.redis = await testRedisConnection();

  // Test Supabase
  results.supabase = await testSupabaseConnection();

  // Summary
  header("Test Results Summary");

  console.log(
    `  Database (PostgreSQL/Prisma): ${results.database ? colors.green + "PASS" : colors.red + "FAIL"}${colors.reset}`,
  );
  console.log(
    `  Redis (Upstash):              ${results.redis ? colors.green + "PASS" : colors.red + "FAIL"}${colors.reset}`,
  );
  console.log(
    `  Supabase:                     ${results.supabase ? colors.green + "PASS" : colors.red + "FAIL"}${colors.reset}`,
  );

  const allPassed = Object.values(results).every(Boolean);
  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.values(results).length;

  console.log(
    `\n${colors.bold}Overall: ${passedCount}/${totalCount} tests passed${colors.reset}`,
  );

  if (!allPassed) {
    console.log(
      `\n${colors.yellow}Some tests failed. Please check the configuration.${colors.reset}`,
    );
    process.exit(1);
  }

  console.log(
    `\n${colors.green}All connectivity tests passed!${colors.reset}\n`,
  );
}

main().catch((error) => {
  console.error("Test runner error:", error);
  process.exit(1);
});
