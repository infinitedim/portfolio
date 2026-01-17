import { z } from "zod";

/**
 * Environment variable schema
 * Mirrors backend env.config.ts but adapted for Next.js
 */
const envSchema = z.object({
  // Core
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_URL_NON_POOLING: z.string().optional(),

  // Redis
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(64, "JWT_SECRET must be at least 64 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN: z
    .string()
    .min(64, "REFRESH_TOKEN must be at least 64 characters"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  JWT_ISSUER: z.string().default("portfolio-app"),
  JWT_AUDIENCE: z.string().default("portfolio-users"),

  // Admin
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be valid"),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_HASH_PASSWORD: z.string().optional(),

  // Spotify (optional)
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  SPOTIFY_REDIRECT_URI: z.string().optional(),

  // AI (optional)
  ANTHROPIC_API_KEY: z.string().optional(),

  // GitHub (optional)
  GH_TOKEN: z.string().optional(),
  GH_USERNAME: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug", "http"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

// Singleton cached env
let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Environment validation failed:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }

  // Production-specific validations
  if (parsed.data.NODE_ENV === "production") {
    if (!parsed.data.ADMIN_HASH_PASSWORD) {
      throw new Error("ADMIN_HASH_PASSWORD is required in production");
    }
    if (parsed.data.ADMIN_PASSWORD) {
      throw new Error("Plain text ADMIN_PASSWORD is forbidden in production");
    }
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

// Helper functions (mirrors backend)
export const isProduction = () => getEnv().NODE_ENV === "production";
export const isDevelopment = () => getEnv().NODE_ENV === "development";
export const isTest = () => getEnv().NODE_ENV === "test";

export const getJWTConfig = () => ({
  secret: getEnv().JWT_SECRET,
  expiresIn: getEnv().JWT_EXPIRES_IN,
  refreshSecret: getEnv().REFRESH_TOKEN,
  refreshExpiresIn: getEnv().REFRESH_TOKEN_EXPIRES_IN,
  issuer: getEnv().JWT_ISSUER,
  audience: getEnv().JWT_AUDIENCE,
});

export const getAdminConfig = () => ({
  email: getEnv().ADMIN_EMAIL,
  password: getEnv().ADMIN_PASSWORD,
  hashedPassword: getEnv().ADMIN_HASH_PASSWORD,
});

export const getSpotifyConfig = () => ({
  clientId: getEnv().SPOTIFY_CLIENT_ID,
  clientSecret: getEnv().SPOTIFY_CLIENT_SECRET,
  redirectUri: getEnv().SPOTIFY_REDIRECT_URI,
});

export const getAIConfig = () => ({
  anthropicKey: getEnv().ANTHROPIC_API_KEY,
});

