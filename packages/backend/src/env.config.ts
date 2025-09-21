import { z } from "zod";
import process from "node:process";

// Create conditional validation based on NODE_ENV
const createEnvSchema = () => {
  return z.object({
    // Node environment
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    // Database - required in all environments
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    // Optional database fields (may not be needed in all setups)
    POSTGRES_USER: z.string().optional(),
    POSTGRES_HOST: z.string().optional(),
    POSTGRES_PRISMA_URL: z.string().optional(),
    POSTGRES_PASSWORD: z.string().optional(),
    POSTGRES_DATABASE: z.string().optional(),
    DATABASE_URL_NON_POOLING: z.string().optional(),

    // Database Connection Pool Configuration
    DB_POOL_MIN: z
      .string()
      .transform(Number)
      .pipe(z.number().min(0))
      .optional(),
    DB_POOL_MAX: z
      .string()
      .transform(Number)
      .pipe(z.number().min(1))
      .optional(),
    DB_POOL_ACQUIRE_TIMEOUT: z
      .string()
      .transform(Number)
      .pipe(z.number().min(1000))
      .optional(),
    DB_POOL_IDLE_TIMEOUT: z
      .string()
      .transform(Number)
      .pipe(z.number().min(1000))
      .optional(),
    DB_QUERY_TIMEOUT: z
      .string()
      .transform(Number)
      .pipe(z.number().min(1000))
      .optional(),
    DB_TRANSACTION_TIMEOUT: z
      .string()
      .transform(Number)
      .pipe(z.number().min(1000))
      .optional(),

    // Supabase (optional - only if using Supabase)
    SUPABASE_JWT_SECRET: z.string().optional(),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),

    // Redis - required for caching
    UPSTASH_REDIS_REST_URL: z
      .string()
      .min(1, "UPSTASH_REDIS_REST_URL is required"),
    UPSTASH_REDIS_REST_TOKEN: z
      .string()
      .min(1, "UPSTASH_REDIS_REST_TOKEN is required"),

    // JWT Configuration - enhanced security validation
    JWT_SECRET: z
      .string()
      .min(64, "JWT_SECRET must be at least 64 characters for security")
      .refine(
        (val) => {
          // Enforce strong entropy requirements for all environments
          const hasNumbers = /\d/.test(val);
          const hasLowerCase = /[a-z]/.test(val);
          const hasUpperCase = /[A-Z]/.test(val);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(val);

          // Require complex secrets in all environments for security consistency
          const isComplex =
            hasNumbers && hasLowerCase && hasUpperCase && hasSpecialChar;

          if (!isComplex) {
            console.warn(
              "JWT_SECRET should contain numbers, lowercase, uppercase, and special characters for optimal security",
            );
          }

          // Only require minimum length, but warn about complexity
          return val.length >= 64;
        },
        {
          message:
            "JWT_SECRET must be at least 64 characters and should contain mixed case, numbers, and special characters",
        },
      ),
    JWT_EXPIRES_IN: z.string().default("15m"),
    REFRESH_TOKEN_SECRET: z
      .string()
      .min(
        64,
        "REFRESH_TOKEN_SECRET must be at least 64 characters for security",
      )
      .refine(
        (val) => {
          // Must be different from JWT_SECRET
          if (val === process.env.JWT_SECRET) {
            return false;
          }
          // Additional entropy check for production
          if (process.env.NODE_ENV === "production") {
            const hasNumbers = /\d/.test(val);
            const hasLowerCase = /[a-z]/.test(val);
            const hasUpperCase = /[A-Z]/.test(val);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(val);
            return hasNumbers && hasLowerCase && hasUpperCase && hasSpecialChar;
          }
          return val.length >= 32; // Minimum for development
        },
        {
          message:
            "REFRESH_TOKEN_SECRET must be different from JWT_SECRET and contain numbers, lowercase, uppercase, and special characters in production",
        },
      ),
    REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),

    // Admin Configuration
    ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be valid email"),
    ADMIN_PASSWORD: z.string().optional(), // For development
    ADMIN_HASH_PASSWORD: z.string().optional(), // For production

    // Application Config
    ANALYZE: z
      .preprocess((val) => {
        if (typeof val === "boolean") return val;
        if (typeof val === "string") return val === "true";
        return false;
      }, z.boolean())
      .default(false),
    LOG_LEVEL: z
      .enum(["error", "warn", "info", "debug", "http"])
      .default("info"),
    SECRET_KEY: z.string().optional(),
    CUSTOM_KEY: z.string().optional(),

    // Next.js Public Variables
    NEXT_PUBLIC_ANALYTICS_ENABLED: z.string().optional(),
    NEXT_PUBLIC_BASE_URL: z.string().optional(),
    NEXT_PUBLIC_ROADMAP_AUTH_TOKEN: z.string().optional(),
    NEXT_PUBLIC_ROADMAP_USER_ID: z.string().optional(),

    // Package version
    NPM_PACKAGE_VERSION: z.string().default("0.0.1"),

    // External Services (optional - only if using these services)
    FIREBASE_PROJECT_ID: z.string().optional(),
    GITHUB_TOKEN: z.string().optional(),
    GITHUB_USERNAME: z.string().optional(),

    // Deployment
    VERCEL_URL: z.string().optional(),

    // Roadmap service
    ROADMAP_AUTH_TOKEN: z.string().optional(),
    ROADMAP_USER_ID: z.string().optional(),

    // Spotify API (optional)
    SPOTIFY_CLIENT_SECRET: z.string().optional(),
    SPOTIFY_CLIENT_ID: z.string().optional(),
    SPOTIFY_REDIRECT_URI: z.string().optional(),

    // AI Services (optional)
    PORTFOLIO_AI_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),

    // Additional config for flexibility
    PORT: z
      .preprocess((val) => {
        if (typeof val === "string" && val.trim() !== "") return Number(val);
        if (typeof val === "number") return val;
        return 4000;
      }, z.number().min(1).max(65535))
      .default(4000),
    FRONTEND_ORIGIN: z.string().optional(),
    IP_ALLOW_LIST: z.string().optional(),
    TLS_KEY_PATH: z.string().optional(),
    TLS_CERT_PATH: z.string().optional(),
    JWT_ISSUER: z.string().default("portfolio-app"),
    JWT_AUDIENCE: z.string().default("portfolio-users"),
  });
};

/**
 * Validate environment variables
 * @returns {ValidatedEnv} The validated environment variables
 */
export function validateEnv(): ValidatedEnv {
  try {
    const schema = createEnvSchema();
    const result = schema.parse(process.env);

    // Additional validation for production
    if (result.NODE_ENV === "production") {
      if (!result.ADMIN_HASH_PASSWORD && !result.ADMIN_PASSWORD) {
        throw new Error(
          "Either ADMIN_HASH_PASSWORD or ADMIN_PASSWORD is required in production",
        );
      }
    }

    console.log(
      `✅ Environment validation successful (${result.NODE_ENV} mode)`,
    );
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment validation failed:");

      // Group errors by type
      const missingRequired = error.errors.filter(
        (err) => err.code === "invalid_type" && err.received === "undefined",
      );

      const invalidFormat = error.errors.filter(
        (err) => err.code !== "invalid_type" || err.received !== "undefined",
      );

      if (missingRequired.length > 0) {
        console.error("\n📋 Missing required environment variables:");
        missingRequired.forEach((err) => {
          console.error(`  ❌ ${err.path.join(".")}: ${err.message}`);
        });
      }

      if (invalidFormat.length > 0) {
        console.error("\n⚠️  Invalid format/value:");
        invalidFormat.forEach((err) => {
          console.error(`  ⚠️  ${err.path.join(".")}: ${err.message}`);
        });
      }

      console.error("\n💡 Tips:");
      console.error(
        "  - Check your .env file exists and is in the correct location",
      );
      console.error("  - Ensure all required variables are set");
      console.error("  - Verify URLs start with http:// or https://");
      console.error(
        "  - Check that JWT secrets are at least 32 characters long",
      );

      throw new Error("Environment validation failed. See details above.");
    }

    console.error("❌ Unexpected error during environment validation:", error);
    throw error;
  }
}

// Type for
export type ValidatedEnv = z.infer<ReturnType<typeof createEnvSchema>>;

// Export validated environment with error handling
let env: ValidatedEnv;

export const getEnv = (): ValidatedEnv => {
  if (!env) {
    try {
      env = validateEnv();
    } catch (error) {
      console.error("Failed to load environment configuration");
      throw error;
    }
  }
  return env;
};

// For backward compatibility, export env but initialize it lazily
export { env };

// Helper functions
export const isProduction = () => getEnv().NODE_ENV === "production";

// Get database URL with fallback
export const getDatabaseUrl = (): string => {
  return getEnv().DATABASE_URL;
};

// Get Redis config
export const getRedisConfig = () => ({
  url: getEnv().UPSTASH_REDIS_REST_URL,
  token: getEnv().UPSTASH_REDIS_REST_TOKEN,
});

// Get JWT config
export const getJWTConfig = () => ({
  secret: getEnv().JWT_SECRET,
  expiresIn: getEnv().JWT_EXPIRES_IN,
  refreshSecret: getEnv().REFRESH_TOKEN_SECRET,
  refreshExpiresIn: getEnv().REFRESH_TOKEN_EXPIRES_IN,
  issuer: getEnv().JWT_ISSUER,
  audience: getEnv().JWT_AUDIENCE,
});

// Get admin config
export const getAdminConfig = () => ({
  email: getEnv().ADMIN_EMAIL,
  password: getEnv().ADMIN_PASSWORD,
  hashedPassword: getEnv().ADMIN_HASH_PASSWORD,
});

// Validate configuration on startup
export const validateConfig = () => {
  console.log("🔧 Validating application configuration...");
  const currentEnv = getEnv();

  // Check database connection would be possible
  if (!currentEnv.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for database operations");
  }

  // Check Redis connection would be possible
  if (
    !currentEnv.UPSTASH_REDIS_REST_URL ||
    !currentEnv.UPSTASH_REDIS_REST_TOKEN
  ) {
    throw new Error("Redis configuration is incomplete");
  }

  // Check JWT configuration
  if (currentEnv.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters for security");
  }

  if (currentEnv.REFRESH_TOKEN_SECRET.length < 32) {
    throw new Error(
      "REFRESH_TOKEN_SECRET must be at least 32 characters for security",
    );
  }

  // Production-specific checks
  if (isProduction()) {
    if (!currentEnv.ADMIN_HASH_PASSWORD && !currentEnv.ADMIN_PASSWORD) {
      throw new Error("Admin authentication must be configured for production");
    }

    if (currentEnv.LOG_LEVEL === "debug") {
      console.warn("⚠️  Warning: Debug logging enabled in production");
    }
  }

  console.log("✅ Configuration validation complete");
};
