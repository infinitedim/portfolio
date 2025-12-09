/**
 * Direct Upstash Redis Connection Test
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

async function testRedisConnection() {
  console.log(
    `\n${colors.bold}${colors.cyan}╔═══════════════════════════════════════════════════════╗${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}║     Upstash Redis Connection Test                     ║${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}╚═══════════════════════════════════════════════════════╝${colors.reset}\n`,
  );

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  log(
    `UPSTASH_REDIS_REST_URL: ${process.env.UPSTASH_REDIS_REST_URL || "not set"}`,
    "info",
  );
  log(
    `UPSTASH_REDIS_REST_TOKEN: ${process.env.UPSTASH_REDIS_REST_TOKEN ? process.env.UPSTASH_REDIS_REST_TOKEN.substring(0, 20) + "..." : "not set"}`,
    "info",
  );

  if (!redisUrl || !redisToken) {
    log("Redis configuration incomplete", "error");
    process.exit(1);
  }

  log(`Using URL: ${redisUrl}`, "info");

  // Disable TLS verification
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  try {
    // Test PING
    log("Testing PING command...", "info");
    const startTime = Date.now();

    const pingResponse = await fetch(`${redisUrl}/PING`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    });

    const latency = Date.now() - startTime;

    if (!pingResponse.ok) {
      const errorText = await pingResponse.text();
      log(`PING failed: HTTP ${pingResponse.status} - ${errorText}`, "error");
      process.exit(1);
    }

    const pingResult = await pingResponse.json();
    log(
      `PING response: ${JSON.stringify(pingResult)} (${latency}ms)`,
      "success",
    );

    // Test SET
    const testKey = `test:${Date.now()}`;
    const setResponse = await fetch(`${redisUrl}/set/${testKey}/hello/ex/30`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });

    if (setResponse.ok) {
      log(`SET ${testKey} = OK`, "success");

      // Test GET
      const getResponse = await fetch(`${redisUrl}/get/${testKey}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });

      const getValue = await getResponse.json();
      log(`GET ${testKey} = ${JSON.stringify(getValue)}`, "success");

      // Cleanup
      await fetch(`${redisUrl}/del/${testKey}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      log("Test key cleaned up", "success");
    }

    console.log(
      `\n${colors.green}${colors.bold}Redis connection test PASSED!${colors.reset}\n`,
    );
  } catch (error) {
    log(
      `Connection FAILED: ${error instanceof Error ? error.message : String(error)}`,
      "error",
    );

    // Try to get more info
    if (error instanceof Error && error.message.includes("fetch")) {
      log("Network error - URL may be unreachable or invalid", "warn");
    }

    console.log(
      `\n${colors.red}${colors.bold}Redis connection test FAILED!${colors.reset}\n`,
    );
    process.exit(1);
  }
}

testRedisConnection();
