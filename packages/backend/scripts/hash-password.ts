#!/usr/bin/env bun
/**
 * Password Hash Generator
 *
 * Generates a bcrypt hash for use in ADMIN_HASH_PASSWORD environment variable.
 *
 * Usage:
 *   bun run --filter backend hash-password <password>
 *   # or directly:
 *   bun packages/backend/scripts/hash-password.ts <password>
 *
 * Example:
 *   bun packages/backend/scripts/hash-password.ts "MySecurePassword123!"
 *
 * Output:
 *   The bcrypt hash to use as ADMIN_HASH_PASSWORD in your .env file
 */

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12; // Secure default for bcrypt

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || !args[0]) {
    console.error("❌ Error: Password argument is required");
    console.error("");
    console.error("Usage:");
    console.error("  bun packages/backend/scripts/hash-password.ts <password>");
    console.error("");
    console.error("Example:");
    console.error(
      '  bun packages/backend/scripts/hash-password.ts "MySecurePassword123!"',
    );
    process.exit(1);
  }

  const password: string = args[0];

  // Basic password strength check
  if (password.length < 12) {
    console.warn(
      "⚠️  Warning: Password should be at least 12 characters for security",
    );
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!(hasLower && hasUpper && hasNumber && hasSpecial)) {
    console.warn(
      "⚠️  Warning: Strong passwords should contain lowercase, uppercase, numbers, and special characters",
    );
  }

  console.log("🔐 Generating bcrypt hash...");
  console.log(`   Salt rounds: ${SALT_ROUNDS}`);

  const startTime = Date.now();
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const duration = Date.now() - startTime;

  console.log("");
  console.log("✅ Hash generated successfully!");
  console.log(`   Generation time: ${duration}ms`);
  console.log("");
  console.log("📋 Add this to your .env file:");
  console.log("");
  console.log(`ADMIN_HASH_PASSWORD=${hash}`);
  console.log("");
  console.log("⚠️  Security reminders:");
  console.log("   - Never commit the .env file to version control");
  console.log("   - Remove ADMIN_PASSWORD if it exists in production .env");
  console.log("   - Keep your password in a secure password manager");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("❌ Failed to generate hash:", message);
  process.exit(1);
});
