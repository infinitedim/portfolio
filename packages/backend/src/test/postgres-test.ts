/**
 * Direct PostgreSQL Connection Test
 * Uses pg driver directly to test database connectivity
 */

import { config } from "dotenv";
import { resolve } from "path";
import { Client } from "pg";

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

async function testPostgresConnection() {
  console.log(
    `\n${colors.bold}${colors.cyan}╔═══════════════════════════════════════════════════════╗${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}║     PostgreSQL Direct Connection Test                 ║${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}╚═══════════════════════════════════════════════════════╝${colors.reset}\n`,
  );

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    log("DATABASE_URL not configured", "error");
    process.exit(1);
  }

  // Clean up the connection string (remove extra quote at the end if present)
  const cleanConnectionString = connectionString.replace(/["']$/, "");

  const maskedUrl = cleanConnectionString.replace(/:[^:@]+@/, ":****@");
  log(`Connection URL: ${maskedUrl}`, "info");

  // Disable TLS verification for self-signed certificates
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const client = new Client({
    connectionString: cleanConnectionString,
    connectionTimeoutMillis: 15000,
  });

  try {
    log("Connecting to PostgreSQL...", "info");
    const startTime = Date.now();

    await client.connect();
    const connectTime = Date.now() - startTime;

    log(`Connected successfully! (${connectTime}ms)`, "success");

    // Test basic query
    const result = await client.query(
      "SELECT NOW() as server_time, version() as version",
    );
    log(`Server time: ${result.rows[0].server_time}`, "success");
    log(`PostgreSQL version: ${result.rows[0].version.split(",")[0]}`, "info");

    // List tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      log(`Tables in database (${tablesResult.rows.length}):`, "info");
      tablesResult.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      log("No tables found in public schema", "warn");
    }

    // Check Prisma migrations
    try {
      const migrationsResult = await client.query(`
        SELECT migration_name, finished_at
        FROM _prisma_migrations
        ORDER BY finished_at DESC
        LIMIT 5
      `);

      if (migrationsResult.rows.length > 0) {
        log(`Recent Prisma migrations:`, "info");
        migrationsResult.rows.forEach((row) => {
          console.log(`   - ${row.migration_name} (${row.finished_at})`);
        });
      }
    } catch {
      log(
        "Prisma migrations table not found (might need to run migrations)",
        "warn",
      );
    }

    // Get database size
    const sizeResult = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    log(`Database size: ${sizeResult.rows[0].size}`, "info");

    await client.end();

    console.log(
      `\n${colors.green}${colors.bold}Database connection test PASSED!${colors.reset}\n`,
    );
    return true;
  } catch (error) {
    log(
      `Connection FAILED: ${error instanceof Error ? error.message : String(error)}`,
      "error",
    );

    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED")) {
        log("Hint: Database server is not reachable", "warn");
      } else if (error.message.includes("authentication")) {
        log("Hint: Check your database credentials", "warn");
      } else if (
        error.message.includes("SSL") ||
        error.message.includes("certificate")
      ) {
        log("Hint: SSL configuration issue - try adjusting sslmode", "warn");
      } else if (error.message.includes("timeout")) {
        log("Hint: Connection timed out - check network/firewall", "warn");
      }
    }

    try {
      await client.end();
    } catch {
      // Ignore
    }

    console.log(
      `\n${colors.red}${colors.bold}Database connection test FAILED!${colors.reset}\n`,
    );
    process.exit(1);
  }
}

testPostgresConnection();
