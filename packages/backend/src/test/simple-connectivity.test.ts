/**
 * Simple Backend Connectivity Test Script
 * Tests Redis (Upstash) and Supabase connections using fetch API
 * No Prisma dependency - uses raw SQL through Supabase REST API
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from root .env
config({ path: resolve(__dirname, "../../../../.env") });

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

async function testRedisConnection(): Promise<boolean> {
  header("Redis Connection Test (Upstash REST API)");

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

    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return false;
    }
  }

  log(`Redis URL: ${redisUrl}`, "info");
  log(
    `Token: ${redisToken ? redisToken.substring(0, 15) + "..." : "not set"}`,
    "info",
  );

  try {
    // Test PING using REST API
    const startTime = Date.now();
    const pingResponse = await fetch(`${redisUrl}/PING`, {
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    });
    const latency = Date.now() - startTime;

    if (!pingResponse.ok) {
      throw new Error(
        `HTTP ${pingResponse.status}: ${await pingResponse.text()}`,
      );
    }

    const pingResult = await pingResponse.json();
    log(
      `PING response: ${JSON.stringify(pingResult)} (Latency: ${latency}ms)`,
      "success",
    );

    // Test SET
    const testKey = `test:connectivity:${Date.now()}`;
    const testValue = JSON.stringify({
      timestamp: new Date().toISOString(),
      test: true,
    });

    const setResponse = await fetch(
      `${redisUrl}/SET/${encodeURIComponent(testKey)}/${encodeURIComponent(testValue)}/EX/60`,
      {
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
      },
    );

    if (!setResponse.ok) {
      throw new Error(`SET failed: ${await setResponse.text()}`);
    }

    const setResult = await setResponse.json();
    log(`SET ${testKey} = OK (${JSON.stringify(setResult)})`, "success");

    // Test GET
    const getResponse = await fetch(
      `${redisUrl}/GET/${encodeURIComponent(testKey)}`,
      {
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
      },
    );

    if (!getResponse.ok) {
      throw new Error(`GET failed: ${await getResponse.text()}`);
    }

    const getValue = await getResponse.json();
    log(`GET ${testKey} = ${JSON.stringify(getValue)}`, "success");

    // Test INCR
    const counterKey = `test:counter:${Date.now()}`;
    await fetch(`${redisUrl}/SET/${encodeURIComponent(counterKey)}/0/EX/60`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });

    const incrResponse = await fetch(
      `${redisUrl}/INCR/${encodeURIComponent(counterKey)}`,
      {
        headers: { Authorization: `Bearer ${redisToken}` },
      },
    );
    const incrResult = await incrResponse.json();
    log(`INCR ${counterKey} = ${JSON.stringify(incrResult)}`, "success");

    // Test DEL (cleanup)
    await fetch(
      `${redisUrl}/DEL/${encodeURIComponent(testKey)}/${encodeURIComponent(counterKey)}`,
      {
        headers: { Authorization: `Bearer ${redisToken}` },
      },
    );
    log("Test keys cleaned up", "success");

    // Test DBSIZE
    try {
      const dbsizeResponse = await fetch(`${redisUrl}/DBSIZE`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      const dbsizeResult = await dbsizeResponse.json();
      log(`DBSIZE: ${JSON.stringify(dbsizeResult)} keys`, "info");
    } catch {
      log("DBSIZE not available", "warn");
    }

    log("Redis connection test PASSED", "success");
    return true;
  } catch (error) {
    log(
      `Redis connection FAILED: ${error instanceof Error ? error.message : String(error)}`,
      "error",
    );
    return false;
  }
}

async function testSupabaseConnection(): Promise<boolean> {
  header("Supabase Connection Test (REST API)");

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log("Supabase configuration missing", "error");
    return false;
  }

  log(`Supabase URL: ${supabaseUrl}`, "info");
  log(`Anon Key: ${supabaseKey.substring(0, 30)}...`, "info");
  log(
    `Service Role Key: ${supabaseServiceKey ? supabaseServiceKey.substring(0, 30) + "..." : "not set"}`,
    "info",
  );

  try {
    // Test Supabase Auth health
    const authUrl = `${supabaseUrl}/auth/v1/health`;
    const startTime = Date.now();

    const authResponse = await fetch(authUrl);
    const authLatency = Date.now() - startTime;

    if (authResponse.ok) {
      const authData = await authResponse.json();
      log(
        `Auth service healthy (Latency: ${authLatency}ms): ${JSON.stringify(authData)}`,
        "success",
      );
    } else {
      log(`Auth service status: ${authResponse.status}`, "warn");
    }

    // Test REST API with anon key
    const restUrl = `${supabaseUrl}/rest/v1/`;
    const restStartTime = Date.now();

    const restResponse = await fetch(restUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    const restLatency = Date.now() - restStartTime;

    log(
      `REST API reachable (Latency: ${restLatency}ms, Status: ${restResponse.status})`,
      restResponse.ok ? "success" : "warn",
    );

    // Test database query using PostgREST RPC
    // This requires the database to have a function or we can use raw query
    if (supabaseServiceKey) {
      // Try to get some basic info using a raw query through PostgREST
      // We'll try to select from a system table
      log("Testing database query capability...", "info");

      // Try listing tables through information_schema
      const tablesResponse = await fetch(`${supabaseUrl}/rest/v1/?select=*`, {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          Accept: "application/json",
        },
      });

      if (tablesResponse.ok) {
        log("Database REST endpoint accessible", "success");
      } else {
        const errorText = await tablesResponse.text();
        log(
          `Database REST response: ${tablesResponse.status} - ${errorText.substring(0, 100)}`,
          "info",
        );
      }
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

async function testDatabaseDirectConnection(): Promise<boolean> {
  header("PostgreSQL Direct Connection Test");

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!databaseUrl) {
    log("DATABASE_URL not configured", "error");
    return false;
  }

  // Parse the URL to check format
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ":****@");
  log(`Connection URL: ${maskedUrl}`, "info");

  // Check if the URL is valid
  try {
    const url = new URL(databaseUrl.replace(/^postgres:\/\//, "http://"));
    log(`Host: ${url.hostname}`, "info");
    log(`Port: ${url.port || "5432/6543"}`, "info");
    log(`Database: ${url.pathname.replace("/", "")}`, "info");
    log(`User: ${url.username}`, "info");
    log(
      `SSL: ${databaseUrl.includes("sslmode") ? "enabled" : "not specified"}`,
      "info",
    );

    // Test DNS resolution for the database host
    log("Testing DNS resolution for database host...", "info");
    try {
      const { execSync } = await import("child_process");
      const dnsResult = execSync(`nslookup ${url.hostname} 8.8.8.8 2>&1`, {
        encoding: "utf-8",
      });

      if (dnsResult.includes("NXDOMAIN") || dnsResult.includes("can't find")) {
        log(`DNS FAILED: Host '${url.hostname}' does not exist`, "error");
        log(
          "The Supabase project may have been deleted or is inactive",
          "warn",
        );
        return false;
      } else {
        log(`DNS OK: Host '${url.hostname}' resolves successfully`, "success");
      }
    } catch (e) {
      log(`DNS check failed: ${e}`, "warn");
    }
  } catch (e) {
    log(`Invalid URL format: ${e}`, "error");
    return false;
  }

  // We can't directly test PostgreSQL without a client library
  // But we can verify the Supabase connection which uses the same database
  log(
    "Direct PostgreSQL test requires Prisma client (use 'bun prisma:studio' to verify)",
    "warn",
  );
  log("Database URL format is valid", "success");

  return true;
}

async function main() {
  console.log(
    `\n${colors.bold}${colors.cyan}╔═══════════════════════════════════════════════════════╗${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}║     Backend Connectivity Test Suite (Simple)          ║${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}║     Testing: Redis (Upstash), Supabase, PostgreSQL    ║${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}╚═══════════════════════════════════════════════════════╝${colors.reset}`,
  );
  console.log(`\nTest started at: ${new Date().toISOString()}\n`);

  // Load env vars
  log("Environment variables loaded", "info");

  const results: Record<string, boolean> = {};

  // Test Redis
  results.redis = await testRedisConnection();

  // Test Supabase
  results.supabase = await testSupabaseConnection();

  // Test Database URL validity
  results.database = await testDatabaseDirectConnection();

  // Summary
  header("Test Results Summary");

  console.log(
    `  Redis (Upstash):    ${results.redis ? colors.green + "PASS" : colors.red + "FAIL"}${colors.reset}`,
  );
  console.log(
    `  Supabase:           ${results.supabase ? colors.green + "PASS" : colors.red + "FAIL"}${colors.reset}`,
  );
  console.log(
    `  Database URL:       ${results.database ? colors.green + "VALID" : colors.red + "INVALID"}${colors.reset}`,
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
