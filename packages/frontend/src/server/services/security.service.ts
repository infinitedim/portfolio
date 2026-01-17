import crypto from "crypto";
import jwt, { type Algorithm, type SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redisService } from "../redis";
import { getJWTConfig, isProduction } from "../config";
import { securityLogger } from "../utils";

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  statusCode: number;
  blockDuration?: number;
}

export interface RateLimitResult {
  isBlocked: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  message?: string;
  statusCode?: number;
}

export interface RateLimitInfo {
  current: number;
  limit: number;
  remaining: number;
  resetTime: number;
  isBlocked: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  error: string | null;
  riskLevel: "low" | "medium" | "high";
}

export interface JWTPayload {
  userId: string;
  email?: string;
  role: "admin";
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  jti?: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  familyId: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  jti?: string;
}

export interface SecurityHeaders {
  [key: string]: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const JWT_ALGORITHM: Algorithm = "HS512";

const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: "Too many login attempts. Please try again later.",
    statusCode: 429,
    blockDuration: 30 * 60 * 1000, // 30 minutes block
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: "Too many API requests. Please try again later.",
    statusCode: 429,
  },
  aiChat: {
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: "AI chat rate limit exceeded.",
    statusCode: 429,
  },
  admin: {
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many admin requests. Please try again later.",
    statusCode: 429,
    blockDuration: 30 * 60 * 1000,
  },
  public: {
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests. Please try again later.",
    statusCode: 429,
  },
};

// Dangerous patterns for input validation
const DANGEROUS_PATTERNS = [
  // SQL Injection
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/gi,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
  /(--|#|\/\*|\*\/)/g,
  /(\b(EXEC|EXECUTE|DECLARE|CAST)\b)/gi,

  // XSS
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+=/gi,
  /<iframe[\s\S]*?>/gi,
  /<object[\s\S]*?>/gi,
  /<embed[\s\S]*?>/gi,

  // Path Traversal
  /\.\.\//g,
  /\.\.\\\\?/g,
  /%2e%2e/gi,

  // Command Injection
  /[;&|`$(){}]/g,
  /\$\(/g,
];

// In-memory rate limit fallback
const inMemoryRateLimits = new Map<
  string,
  { count: number; resetTime: number }
>();

// ============================================================================
// JWT OPERATIONS
// ============================================================================

/**
 * Generate JWT access token with enhanced security
 */
export function generateAccessToken(
  payload: Omit<JWTPayload, "iat" | "exp" | "iss" | "aud" | "jti">,
): string {
  const config = getJWTConfig();
  const jti = crypto.randomUUID();

  const options: SignOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: config.expiresIn,
    issuer: config.issuer,
    audience: config.audience,
    jwtid: jti,
  } as SignOptions;

  return jwt.sign(payload, config.secret, options);
}

/**
 * Generate JWT refresh token with enhanced security
 */
export function generateRefreshToken(
  userId: string,
  familyId?: string,
): string {
  const config = getJWTConfig();
  const tokenId = crypto.randomUUID();
  const family = familyId ?? crypto.randomUUID();

  const payload: Omit<
    RefreshTokenPayload,
    "iat" | "exp" | "iss" | "aud" | "jti"
  > = {
    userId,
    tokenId,
    familyId: family,
  };

  const options: SignOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: config.refreshExpiresIn,
    issuer: config.issuer,
    audience: config.audience,
    jwtid: tokenId,
  } as SignOptions;

  return jwt.sign(payload, config.refreshSecret, options);
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  const config = getJWTConfig();

  try {
    return jwt.verify(token, config.secret, {
      algorithms: [JWT_ALGORITHM],
      issuer: config.issuer,
      audience: config.audience,
    }) as JWTPayload;
  } catch (error) {
    securityLogger.error("Access token verification failed", { error });
    throw new Error("Invalid or expired access token");
  }
}

/**
 * Verify JWT refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const config = getJWTConfig();

  try {
    return jwt.verify(token, config.refreshSecret, {
      algorithms: [JWT_ALGORITHM],
      issuer: config.issuer,
      audience: config.audience,
    }) as RefreshTokenPayload;
  } catch (error) {
    securityLogger.error("Refresh token verification failed", { error });
    throw new Error("Invalid or expired refresh token");
  }
}

// ============================================================================
// PASSWORD OPERATIONS
// ============================================================================

const BCRYPT_ROUNDS = isProduction() ? 14 : 10;

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Check rate limit for a given key
 */
export async function checkRateLimit(
  key: string,
  configName: keyof typeof DEFAULT_RATE_LIMITS = "api",
): Promise<RateLimitResult> {
  const config = DEFAULT_RATE_LIMITS[configName] || DEFAULT_RATE_LIMITS.api;
  const now = Date.now();
  const windowEnd = now + config.windowMs;
  const redisKey = `ratelimit:${configName}:${key}`;
  const blockKey = `blocked:${configName}:${key}`;

  // Check if blocked
  if (redisService.isAvailable()) {
    try {
      const isBlocked = await redisService.exists(blockKey);
      if (isBlocked) {
        const retryAfter = Math.ceil((config.blockDuration || 0) / 1000);
        return {
          isBlocked: true,
          remaining: 0,
          resetTime: now + (config.blockDuration || 0),
          retryAfter,
          message: config.message,
          statusCode: config.statusCode,
        };
      }
    } catch (error) {
      securityLogger.warn("Redis block check failed", { error });
    }
  }

  // Try Redis first
  if (redisService.isAvailable()) {
    try {
      const current = await redisService.incr(redisKey);

      if (current === 1) {
        await redisService.expire(redisKey, Math.ceil(config.windowMs / 1000));
      }

      const ttl = await redisService.ttl(redisKey);
      const resetTime = now + (ttl > 0 ? ttl * 1000 : config.windowMs);

      if (current > config.max) {
        // Block if configured
        if (config.blockDuration) {
          await redisService.set(blockKey, "1", Math.ceil(config.blockDuration / 1000));
        }

        return {
          isBlocked: true,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil((resetTime - now) / 1000),
          message: config.message,
          statusCode: config.statusCode,
        };
      }

      return {
        isBlocked: false,
        remaining: Math.max(0, config.max - current),
        resetTime,
      };
    } catch (error) {
      securityLogger.warn("Redis rate limit failed, falling back to memory", {
        error,
      });
    }
  }

  // Fallback to in-memory
  const existing = inMemoryRateLimits.get(redisKey);

  if (!existing || existing.resetTime < now) {
    inMemoryRateLimits.set(redisKey, { count: 1, resetTime: windowEnd });
    return {
      isBlocked: false,
      remaining: config.max - 1,
      resetTime: windowEnd,
    };
  }

  existing.count++;

  if (existing.count > config.max) {
    return {
      isBlocked: true,
      remaining: 0,
      resetTime: existing.resetTime,
      retryAfter: Math.ceil((existing.resetTime - now) / 1000),
      message: config.message,
      statusCode: config.statusCode,
    };
  }

  return {
    isBlocked: false,
    remaining: Math.max(0, config.max - existing.count),
    resetTime: existing.resetTime,
  };
}

/**
 * Get current rate limit info
 */
export async function getRateLimitInfo(
  key: string,
  configName: keyof typeof DEFAULT_RATE_LIMITS = "api",
): Promise<RateLimitInfo> {
  const config = DEFAULT_RATE_LIMITS[configName] || DEFAULT_RATE_LIMITS.api;
  const redisKey = `ratelimit:${configName}:${key}`;
  const blockKey = `blocked:${configName}:${key}`;

  let current = 0;
  let resetTime = Date.now() + config.windowMs;
  let isBlocked = false;

  if (redisService.isAvailable()) {
    try {
      const value = await redisService.get<number>(redisKey);
      const ttl = await redisService.ttl(redisKey);
      isBlocked = await redisService.exists(blockKey);

      current = value ?? 0;
      resetTime = ttl > 0 ? Date.now() + ttl * 1000 : resetTime;
    } catch (error) {
      securityLogger.warn("Redis rate limit info failed", { error });
    }
  } else {
    const existing = inMemoryRateLimits.get(redisKey);
    if (existing) {
      current = existing.count;
      resetTime = existing.resetTime;
      isBlocked = current >= config.max;
    }
  }

  return {
    current,
    limit: config.max,
    remaining: Math.max(0, config.max - current),
    resetTime,
    isBlocked,
  };
}

// ============================================================================
// INPUT VALIDATION & SANITIZATION
// ============================================================================

/**
 * Validate and sanitize user input
 */
export function validateInput(
  input: string,
  options: { maxLength?: number; allowHtml?: boolean } = {},
): ValidationResult {
  const { maxLength = 10000, allowHtml = false } = options;

  // Length check
  if (input.length > maxLength) {
    return {
      isValid: false,
      sanitized: "",
      error: `Input exceeds maximum length of ${maxLength}`,
      riskLevel: "low",
    };
  }

  // Check for dangerous patterns
  const detectedPatterns: string[] = [];
  let riskLevel: "low" | "medium" | "high" = "low";

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      detectedPatterns.push(pattern.source);

      // SQL injection or script tags = high risk
      if (
        pattern.source.includes("SELECT") ||
        pattern.source.includes("script")
      ) {
        riskLevel = "high";
      } else if (riskLevel !== "high") {
        riskLevel = "medium";
      }
    }
  }

  if (detectedPatterns.length > 0 && riskLevel === "high") {
    securityLogger.warn("Dangerous input detected", {
      patterns: detectedPatterns,
      riskLevel,
      inputPreview: input.substring(0, 100),
    });

    return {
      isValid: false,
      sanitized: "",
      error: "Input contains potentially malicious content",
      riskLevel,
    };
  }

  // Sanitize
  let sanitized = input;

  if (!allowHtml) {
    sanitized = sanitized
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  return {
    isValid: true,
    sanitized,
    error: null,
    riskLevel,
  };
}

/**
 * Basic HTML sanitization
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

/**
 * Detect dangerous patterns in input
 */
export function detectDangerousPatterns(input: string): string[] {
  const detected: string[] = [];
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      detected.push(pattern.source);
    }
  }
  return detected;
}

// ============================================================================
// CSRF PROTECTION
// ============================================================================

const CSRF_TOKEN_LENGTH = 64;
const CSRF_TOKEN_PREFIX = "csrf:";

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Store CSRF token in Redis
 */
export async function storeCSRFToken(
  sessionId: string,
  token: string,
  ttlSeconds: number = 3600,
): Promise<boolean> {
  const key = `${CSRF_TOKEN_PREFIX}${sessionId}`;
  return redisService.set(key, token, ttlSeconds);
}

/**
 * Validate CSRF token
 */
export async function validateCSRFToken(
  sessionId: string,
  token: string,
): Promise<boolean> {
  const key = `${CSRF_TOKEN_PREFIX}${sessionId}`;
  const storedToken = await redisService.get<string>(key);

  if (!storedToken) return false;

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token, "hex"),
      Buffer.from(storedToken, "hex"),
    );
  } catch {
    return false;
  }
}

// ============================================================================
// ENCRYPTION
// ============================================================================

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.SECRET_KEY || process.env.JWT_SECRET;
  if (!secret) throw new Error("Encryption key not configured");
  return crypto.scryptSync(secret, "salt", 32);
}

/**
 * Encrypt data
 */
export function encrypt(data: string): string {
  const key = getEncryptionKey();
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(IV_LENGTH);

  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, "sha512");
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, derivedKey, iv);
  cipher.setAAD(salt);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  const result = Buffer.concat([
    salt,
    iv,
    tag,
    Buffer.from(encrypted, "hex"),
  ]).toString("base64");

  return result;
}

/**
 * Decrypt data
 */
export function decrypt(encrypted: string): string {
  const key = getEncryptionKey();
  const data = Buffer.from(encrypted, "base64");

  let offset = 0;
  const salt = data.subarray(offset, offset + 16);
  offset += 16;

  const iv = data.subarray(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;

  const tag = data.subarray(offset, offset + TAG_LENGTH);
  offset += TAG_LENGTH;

  const encryptedData = data.subarray(offset);

  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, "sha512");
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(tag);
  decipher.setAAD(salt);

  let decrypted = decipher.update(encryptedData, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// ============================================================================
// API KEY GENERATION
// ============================================================================

/**
 * Generate secure API key
 */
export function generateApiKey(): string {
  const config = getJWTConfig();
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const combined = `${timestamp}-${randomBytes}`;

  return crypto
    .createHmac("sha512", config.secret)
    .update(combined)
    .digest("hex");
}

/**
 * Hash API key for storage
 */
export function hashApiKey(apiKey: string): string {
  const config = getJWTConfig();
  return crypto.createHmac("sha512", config.secret).update(apiKey).digest("hex");
}

/**
 * Verify API key
 */
export function verifyApiKey(apiKey: string, storedHash: string): boolean {
  const hash = hashApiKey(apiKey);

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(storedHash, "hex"),
    );
  } catch {
    return false;
  }
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

/**
 * Get security headers for responses
 */
export function getSecurityHeaders(nonce?: string): SecurityHeaders {
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${nonce ? `'nonce-${nonce}'` : "'unsafe-eval'"} https://fonts.googleapis.com`,
    `style-src 'self' 'unsafe-inline' ${nonce ? `'nonce-${nonce}'` : ""} https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.github.com https://api.spotify.com wss:",
    "media-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const headers: SecurityHeaders = {
    "Content-Security-Policy": cspDirectives,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };

  if (isProduction()) {
    headers["Strict-Transport-Security"] =
      "max-age=31536000; includeSubDomains";
  }

  return headers;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Create session in Redis
 */
export async function createSession(
  userId: string,
  data: Record<string, unknown>,
  ttl: number,
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const sessionData = {
    userId,
    ...data,
    createdAt: Date.now(),
  };

  const key = `session:${sessionId}`;
  await redisService.set(key, sessionData, ttl);
  return sessionId;
}

/**
 * Get session from Redis
 */
export async function getSession<T = Record<string, unknown>>(
  sessionId: string,
): Promise<{ userId: string; data: T } | null> {
  const key = `session:${sessionId}`;
  const session = await redisService.get<{
    userId: string;
    data: T;
    createdAt: number;
  }>(key);

  if (!session) return null;

  return {
    userId: session.userId,
    data: session.data,
  };
}

/**
 * Delete session from Redis
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const key = `session:${sessionId}`;
  await redisService.del(key);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const securityService = {
  // JWT
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,

  // Password
  hashPassword,
  verifyPassword,

  // Rate Limiting
  checkRateLimit,
  getRateLimitInfo,

  // Input Validation
  validateInput,
  sanitizeInput,
  detectDangerousPatterns,

  // CSRF
  generateCSRFToken,
  storeCSRFToken,
  validateCSRFToken,

  // Encryption
  encrypt,
  decrypt,

  // API Keys
  generateApiKey,
  hashApiKey,
  verifyApiKey,

  // Headers
  getSecurityHeaders,

  // Session
  createSession,
  getSession,
  deleteSession,
};

export type SecurityService = typeof securityService;

