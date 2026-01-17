# Phase 3: Service Layer Migration

## 🎯 Tujuan Phase

Migrasi semua NestJS services ke plain TypeScript modules dengan function-based approach.

**Estimasi Waktu: 3-5 hari**

---

## 📋 Task Checklist

### 3.1 Security Service (CRITICAL)

- [x] Create `src/server/services/security.service.ts`
- [x] Migrate JWT operations
- [x] Migrate password hashing
- [x] Migrate rate limiting
- [x] Migrate input validation
- [x] Migrate CSRF protection
- [x] Migrate encryption utilities

### 3.2 Auth Service

- [x] Create `src/server/services/auth.service.ts`
- [x] Migrate login/logout
- [x] Migrate token refresh
- [x] Migrate token blacklisting
- [x] Migrate user validation

### 3.3 Audit Log Service

- [x] Create `src/server/services/audit-log.service.ts`
- [x] Migrate event logging
- [x] Migrate log retrieval

### 3.4 Other Services

- [x] Blog service
- [x] Projects service
- [x] Spotify service
- [x] AI service
- [x] Health service

---

## 🏗️ Implementation Details

### 3.1 Security Service

**File:** `packages/frontend/src/server/services/security.service.ts`

```typescript
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

// ============================================================================
// CONFIGURATION
// ============================================================================

const JWT_ALGORITHM: Algorithm = "HS256";

const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: "Too many login attempts. Please try again later.",
    statusCode: 429,
    blockDuration: 30 * 60 * 1000, // 30 minutes block
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: "Too many requests. Please slow down.",
    statusCode: 429,
  },
  aiChat: {
    windowMs: 60 * 1000,
    max: 10,
    message: "AI chat rate limit exceeded.",
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
  /on\w+\s*=/gi,
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
  };

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
  };

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

const BCRYPT_ROUNDS = isProduction() ? 12 : 10;

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

  let current = 0;
  let resetTime = Date.now() + config.windowMs;

  if (redisService.isAvailable()) {
    const value = await redisService.get<number>(redisKey);
    const ttl = await redisService.ttl(redisKey);

    current = value ?? 0;
    resetTime = ttl > 0 ? Date.now() + ttl * 1000 : resetTime;
  } else {
    const existing = inMemoryRateLimits.get(redisKey);
    if (existing) {
      current = existing.count;
      resetTime = existing.resetTime;
    }
  }

  return {
    current,
    limit: config.max,
    remaining: Math.max(0, config.max - current),
    resetTime,
    isBlocked: current >= config.max,
  };
}

// ============================================================================
// INPUT VALIDATION & SANITIZATION
// ============================================================================

const inputSchema = z.string().max(10000);

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

// ============================================================================
// CSRF PROTECTION
// ============================================================================

const CSRF_TOKEN_LENGTH = 32;
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
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken));
}

// ============================================================================
// ENCRYPTION
// ============================================================================

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

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
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt data
 */
export function decrypt(encrypted: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, data] = encrypted.split(":");

  if (!ivHex || !authTagHex || !data) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(data, "hex", "utf8");
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
  const prefix = "pk_";
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(24).toString("base64url");
  return `${prefix}${timestamp}_${random}`;
}

/**
 * Hash API key for storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Verify API key
 */
export function verifyApiKey(apiKey: string, storedHash: string): boolean {
  const hash = hashApiKey(apiKey);

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
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
export function getSecurityHeaders(): Record<string, string> {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.github.com https://api.spotify.com wss:",
    "media-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  return {
    "Content-Security-Policy": cspDirectives,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
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
};

export type SecurityService = typeof securityService;
```

---

### 3.2 Auth Service

**File:** `packages/frontend/src/server/services/auth.service.ts`

```typescript
import { prisma } from "../db";
import { redisService } from "../redis";
import { getAdminConfig, getJWTConfig } from "../config";
import { authLogger } from "../utils";
import {
  securityService,
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  verifyPassword,
  hashPassword,
  checkRateLimit,
} from "./security.service";
import { auditLogService } from "./audit-log.service";

// ============================================================================
// TYPES
// ============================================================================

export interface AuthUser {
  userId: string;
  email: string;
  role: "admin";
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TOKEN_BLACKLIST_PREFIX = "token:blacklist:";
const TOKEN_FAMILY_PREFIX = "token:family:";

function parseTimeToSeconds(timeStr: string): number {
  const unit = timeStr.slice(-1);
  const value = parseInt(timeStr.slice(0, -1), 10);

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    default:
      return 900; // default 15 minutes
  }
}

function getTokenBlacklistTTL(): number {
  const config = getJWTConfig();
  const accessTTL = parseTimeToSeconds(config.expiresIn);
  return accessTTL + 300; // extra 5 minutes buffer
}

function getTokenFamilyTTL(): number {
  const config = getJWTConfig();
  return parseTimeToSeconds(config.refreshExpiresIn);
}

// ============================================================================
// AUTH OPERATIONS
// ============================================================================

/**
 * Validate user credentials and return tokens
 */
export async function validateCredentials(
  email: string,
  password: string,
  clientIp: string,
  userAgent?: string,
): Promise<AuthResult> {
  // Check rate limit
  const rateLimit = await checkRateLimit(clientIp, "login");
  if (rateLimit.isBlocked) {
    authLogger.warn("Login rate limited", { email, clientIp });
    throw new Error(rateLimit.message || "Too many login attempts");
  }

  // Get admin config
  const adminConfig = getAdminConfig();

  // Validate email
  if (email !== adminConfig.email) {
    authLogger.warn("Invalid login email", { email, clientIp });
    await auditLogService.logLoginFailure(email, clientIp, "Invalid email");
    throw new Error("Invalid email or password");
  }

  // Get password hash
  let passwordHash: string;
  if (adminConfig.hashedPassword) {
    passwordHash = adminConfig.hashedPassword;
  } else if (adminConfig.password) {
    passwordHash = await hashPassword(adminConfig.password);
  } else {
    // Try to get from database
    const dbUser = await prisma.adminUser.findUnique({
      where: { email },
      select: { passwordHash: true },
    });

    if (!dbUser) {
      throw new Error("Invalid email or password");
    }
    passwordHash = dbUser.passwordHash;
  }

  // Verify password
  const isValid = await verifyPassword(password, passwordHash);
  if (!isValid) {
    authLogger.warn("Invalid login password", { email, clientIp });
    await auditLogService.logLoginFailure(email, clientIp, "Invalid password");
    throw new Error("Invalid email or password");
  }

  // Generate tokens
  const user: AuthUser = {
    userId: "admin-1",
    email: adminConfig.email,
    role: "admin",
  };

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.userId);

  // Log successful login
  await auditLogService.logLogin(user.userId, clientIp, userAgent);

  authLogger.info("User logged in", { userId: user.userId, email });

  return {
    user,
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  token: string,
  clientIp: string,
): Promise<TokenPair> {
  try {
    const payload = verifyRefreshToken(token);

    // Check if token/family is blacklisted
    const familyKey = `${TOKEN_FAMILY_PREFIX}${payload.familyId}`;
    const isBlacklisted = await redisService.exists(familyKey);

    if (isBlacklisted) {
      authLogger.warn("Token family blacklisted, possible theft", {
        familyId: payload.familyId,
        clientIp,
      });
      throw new Error("Token has been revoked");
    }

    // Generate new tokens (same family)
    const user: AuthUser = {
      userId: payload.userId,
      email: getAdminConfig().email,
      role: "admin",
    };

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(
      payload.userId,
      payload.familyId,
    );

    authLogger.debug("Tokens refreshed", { userId: payload.userId });

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    authLogger.error("Token refresh failed", { error, clientIp });
    throw new Error("Invalid or expired refresh token");
  }
}

/**
 * Logout user and blacklist tokens
 */
export async function logout(
  accessToken: string,
  clientIp: string,
  userAgent?: string,
  refreshToken?: string,
): Promise<void> {
  try {
    // Verify and blacklist access token
    const payload = verifyAccessToken(accessToken);

    if (payload.jti) {
      await blacklistToken(payload.jti);
    }

    // If refresh token provided, blacklist the family
    if (refreshToken) {
      try {
        const refreshPayload = verifyRefreshToken(refreshToken);
        const familyKey = `${TOKEN_FAMILY_PREFIX}${refreshPayload.familyId}`;
        await redisService.set(familyKey, "blacklisted", getTokenFamilyTTL());
      } catch {
        // Ignore refresh token verification errors during logout
      }
    }

    // Log logout
    await auditLogService.logLogout(payload.userId, clientIp, userAgent);

    authLogger.info("User logged out", { userId: payload.userId });
  } catch (error) {
    authLogger.error("Logout error", { error });
    throw error;
  }
}

/**
 * Validate access token
 */
export async function validateToken(token: string): Promise<AuthUser> {
  const payload = verifyAccessToken(token);

  // Check if blacklisted
  if (payload.jti) {
    const isBlacklisted = await isTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      throw new Error("Token has been revoked");
    }
  }

  return {
    userId: payload.userId,
    email: payload.email || getAdminConfig().email,
    role: payload.role,
  };
}

/**
 * Blacklist a token by its JTI
 */
export async function blacklistToken(jti: string): Promise<void> {
  const key = `${TOKEN_BLACKLIST_PREFIX}${jti}`;
  await redisService.set(key, "blacklisted", getTokenBlacklistTTL());
}

/**
 * Check if token is blacklisted
 */
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const key = `${TOKEN_BLACKLIST_PREFIX}${jti}`;
  return redisService.exists(key);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const authService = {
  validateCredentials,
  refreshAccessToken,
  logout,
  validateToken,
  blacklistToken,
  isTokenBlacklisted,
};

export type AuthService = typeof authService;
```

---

### 3.3 Audit Log Service

**File:** `packages/frontend/src/server/services/audit-log.service.ts`

```typescript
import { prisma } from "../db";
import { redisService } from "../redis";
import { securityLogger } from "../utils";

// ============================================================================
// TYPES
// ============================================================================

export enum AuditEventType {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILURE = "login_failure",
  LOGOUT = "logout",
  TOKEN_REFRESH = "token_refresh",
  PASSWORD_CHANGE = "password_change",
  SECURITY_VIOLATION = "security_violation",
  RATE_LIMIT_HIT = "rate_limit_hit",
  API_ACCESS = "api_access",
}

export interface AuditEvent {
  action: string;
  resource: string;
  resourceId?: string;
  adminUserId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log an audit event
 */
export async function logEvent(event: AuditEvent): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId,
        adminUserId: event.adminUserId,
        details: event.details ?? {},
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        url: event.url,
        method: event.method,
        statusCode: event.statusCode,
      },
    });
  } catch (error) {
    securityLogger.error("Failed to log audit event", { event, error });

    // Fallback to Redis for later processing
    try {
      const key = `audit:pending:${Date.now()}`;
      await redisService.set(key, event, 86400); // 24h TTL
    } catch {
      securityLogger.error("Failed to queue audit event to Redis");
    }
  }
}

/**
 * Log successful login
 */
export async function logLogin(
  userId: string,
  ipAddress: string,
  userAgent?: string,
): Promise<void> {
  await logEvent({
    action: AuditEventType.LOGIN_SUCCESS,
    resource: "auth",
    adminUserId: userId,
    ipAddress,
    userAgent,
    details: { timestamp: new Date().toISOString() },
  });
}

/**
 * Log failed login attempt
 */
export async function logLoginFailure(
  email: string,
  ipAddress: string,
  reason: string,
): Promise<void> {
  await logEvent({
    action: AuditEventType.LOGIN_FAILURE,
    resource: "auth",
    ipAddress,
    details: {
      email,
      reason,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log logout
 */
export async function logLogout(
  userId: string,
  ipAddress: string,
  userAgent?: string,
): Promise<void> {
  await logEvent({
    action: AuditEventType.LOGOUT,
    resource: "auth",
    adminUserId: userId,
    ipAddress,
    userAgent,
  });
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  type: string,
  details: Record<string, unknown>,
  ipAddress?: string,
): Promise<void> {
  securityLogger.warn("Security event", { type, details, ipAddress });

  await logEvent({
    action: AuditEventType.SECURITY_VIOLATION,
    resource: "security",
    ipAddress,
    details: { type, ...details },
  });
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(options: {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{
  logs: Array<{
    id: string;
    action: string;
    resource: string;
    resourceId: string | null;
    details: unknown;
    ipAddress: string | null;
    createdAt: Date;
  }>;
  total: number;
}> {
  const where: Record<string, unknown> = {};

  if (options.userId) where.adminUserId = options.userId;
  if (options.action) where.action = options.action;
  if (options.resource) where.resource = options.resource;
  if (options.startDate || options.endDate) {
    where.createdAt = {
      ...(options.startDate && { gte: options.startDate }),
      ...(options.endDate && { lte: options.endDate }),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options.limit ?? 50,
      skip: options.offset ?? 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const auditLogService = {
  logEvent,
  logLogin,
  logLoginFailure,
  logLogout,
  logSecurityEvent,
  getAuditLogs,
};

export type AuditLogService = typeof auditLogService;
```

---

### 3.4 Blog Service

**File:** `packages/frontend/src/server/services/blog.service.ts`

```typescript
import { prisma } from "../db";
import { redisService } from "../redis";
import type { BlogPost } from "@prisma/client";

const CACHE_PREFIX = "blog:";
const CACHE_TTL = 300; // 5 minutes

export interface BlogPostCreateInput {
  title: string;
  slug: string;
  summary?: string;
  contentMd?: string;
  contentHtml?: string;
  published?: boolean;
  authorId?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
}

export interface BlogPostUpdateInput extends Partial<BlogPostCreateInput> {}

/**
 * Get all blog posts
 */
export async function getAll(options?: {
  published?: boolean;
  limit?: number;
  offset?: number;
}): Promise<BlogPost[]> {
  const cacheKey = `${CACHE_PREFIX}list:${JSON.stringify(options)}`;

  const cached = await redisService.get<BlogPost[]>(cacheKey);
  if (cached) return cached;

  const posts = await prisma.blogPost.findMany({
    where:
      options?.published !== undefined
        ? { published: options.published }
        : undefined,
    orderBy: { publishedAt: "desc" },
    take: options?.limit ?? 20,
    skip: options?.offset ?? 0,
  });

  await redisService.set(cacheKey, posts, CACHE_TTL);
  return posts;
}

/**
 * Get blog post by slug
 */
export async function getBySlug(slug: string): Promise<BlogPost | null> {
  const cacheKey = `${CACHE_PREFIX}slug:${slug}`;

  const cached = await redisService.get<BlogPost>(cacheKey);
  if (cached) return cached;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (post) {
    await redisService.set(cacheKey, post, CACHE_TTL);
  }

  return post;
}

/**
 * Create blog post
 */
export async function create(data: BlogPostCreateInput): Promise<BlogPost> {
  const post = await prisma.blogPost.create({
    data: {
      ...data,
      publishedAt: data.published ? new Date() : null,
    },
  });

  // Invalidate cache
  await invalidateCache();

  return post;
}

/**
 * Update blog post
 */
export async function update(
  id: string,
  data: BlogPostUpdateInput,
): Promise<BlogPost> {
  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...data,
      publishedAt: data.published ? new Date() : undefined,
    },
  });

  // Invalidate cache
  await invalidateCache();
  await redisService.del(`${CACHE_PREFIX}slug:${post.slug}`);

  return post;
}

/**
 * Delete blog post
 */
export async function remove(id: string): Promise<void> {
  const post = await prisma.blogPost.delete({
    where: { id },
  });

  await invalidateCache();
  await redisService.del(`${CACHE_PREFIX}slug:${post.slug}`);
}

/**
 * Invalidate list cache
 */
async function invalidateCache(): Promise<void> {
  const keys = await redisService.keys(`${CACHE_PREFIX}list:*`);
  for (const key of keys) {
    await redisService.del(key);
  }
}

export const blogService = {
  getAll,
  getBySlug,
  create,
  update,
  remove,
};

export type BlogService = typeof blogService;
```

---

### 3.5 Projects Service

**File:** `packages/frontend/src/server/services/projects.service.ts`

```typescript
import { prisma } from "../db";
import { redisService } from "../redis";
import type { Project, ProjectStatus } from "@prisma/client";

const CACHE_PREFIX = "projects:";
const CACHE_TTL = 600; // 10 minutes

/**
 * Get all projects
 */
export async function getAll(options?: {
  status?: ProjectStatus;
  featured?: boolean;
  limit?: number;
}): Promise<Project[]> {
  const cacheKey = `${CACHE_PREFIX}list:${JSON.stringify(options)}`;

  const cached = await redisService.get<Project[]>(cacheKey);
  if (cached) return cached;

  const projects = await prisma.project.findMany({
    where: {
      ...(options?.status && { status: options.status }),
      ...(options?.featured !== undefined && { featured: options.featured }),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: options?.limit,
  });

  await redisService.set(cacheKey, projects, CACHE_TTL);
  return projects;
}

/**
 * Get project by slug
 */
export async function getBySlug(slug: string): Promise<Project | null> {
  const cacheKey = `${CACHE_PREFIX}slug:${slug}`;

  const cached = await redisService.get<Project>(cacheKey);
  if (cached) return cached;

  const project = await prisma.project.findUnique({
    where: { slug },
  });

  if (project) {
    await redisService.set(cacheKey, project, CACHE_TTL);
  }

  return project;
}

/**
 * Get featured projects
 */
export async function getFeatured(limit: number = 6): Promise<Project[]> {
  return getAll({ featured: true, status: "ACTIVE", limit });
}

/**
 * Increment view count
 */
export async function incrementViews(id: string): Promise<void> {
  await prisma.project.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });
}

export const projectsService = {
  getAll,
  getBySlug,
  getFeatured,
  incrementViews,
};

export type ProjectsService = typeof projectsService;
```

---

### 3.6 Spotify Service

**File:** `packages/frontend/src/server/services/spotify.service.ts`

```typescript
import { redisService } from "../redis";
import { getSpotifyConfig } from "../config";
import { apiLogger } from "../utils";

const CACHE_KEY = "spotify:now-playing";
const CACHE_TTL = 60; // 1 minute
const ERROR_CACHE_TTL = 30; // 30 seconds on error

export interface NowPlayingResponse {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
  progress?: number;
  duration?: number;
}

interface SpotifyAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyCurrentlyPlayingResponse {
  is_playing: boolean;
  currently_playing_type: string;
  item?: {
    id: string;
    name: string;
    duration_ms: number;
    external_urls: { spotify: string };
    artists: Array<{ id: string; name: string }>;
    album: {
      id: string;
      name: string;
      images: Array<{ url: string; height: number; width: number }>;
    };
  };
  progress_ms?: number;
}

/**
 * Get Spotify access token using Client Credentials flow
 */
async function getAccessToken(): Promise<string> {
  const config = getSpotifyConfig();

  if (!config.clientId || !config.clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  const basic = Buffer.from(
    `${config.clientId}:${config.clientSecret}`,
  ).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error(`Spotify token exchange failed: ${response.status}`);
  }

  const data = (await response.json()) as SpotifyAccessTokenResponse;
  return data.access_token;
}

/**
 * Get currently playing track
 */
export async function nowPlaying(): Promise<NowPlayingResponse> {
  // Check cache first
  const cached = await redisService.get<NowPlayingResponse>(CACHE_KEY);
  if (cached) return cached;

  try {
    const config = getSpotifyConfig();

    if (!config.clientId || !config.clientSecret) {
      return { isPlaying: false };
    }

    const accessToken = await getAccessToken();

    const response = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status === 204) {
      const payload: NowPlayingResponse = { isPlaying: false };
      await redisService.set(CACHE_KEY, payload, CACHE_TTL);
      return payload;
    }

    if (response.status === 429) {
      apiLogger.warn("Spotify API rate limited");
      return { isPlaying: false };
    }

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const data = (await response.json()) as SpotifyCurrentlyPlayingResponse;

    if (data.currently_playing_type !== "track" || !data.item) {
      const payload: NowPlayingResponse = { isPlaying: false };
      await redisService.set(CACHE_KEY, payload, CACHE_TTL);
      return payload;
    }

    const payload: NowPlayingResponse = {
      isPlaying: data.is_playing,
      title: data.item.name,
      artist: data.item.artists.map((a) => a.name).join(", "),
      album: data.item.album.name,
      albumImageUrl: data.item.album.images[0]?.url,
      songUrl: data.item.external_urls.spotify,
      progress: data.progress_ms,
      duration: data.item.duration_ms,
    };

    await redisService.set(CACHE_KEY, payload, CACHE_TTL);
    return payload;
  } catch (error) {
    apiLogger.error("Spotify nowPlaying error", { error });

    const fallback: NowPlayingResponse = { isPlaying: false };
    await redisService.set(CACHE_KEY, fallback, ERROR_CACHE_TTL);
    return fallback;
  }
}

export const spotifyService = {
  nowPlaying,
};

export type SpotifyService = typeof spotifyService;
```

---

### 3.7 AI Service

**File:** `packages/frontend/src/server/services/ai.service.ts`

```typescript
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, type CoreMessage } from "ai";
import { getAIConfig } from "../config";
import { apiLogger } from "../utils";

const SYSTEM_PROMPT = `You are a helpful, professional, and slightly witty terminal assistant for a developer portfolio.
Your goal is to help visitors navigate the portfolio, understand the developer's skills, and provide context about the projects.

Tone:
- Professional but approachable.
- Occasional tech humor or terminal-themed jokes are allowed.
- Concise responses (suitable for a terminal interface).

Context:
- This is a portfolio for a Full-Stack Developer.
- Tech stack: React, Next.js, TypeScript, Tailwind CSS.

If asked about specific projects or skills, try to be informative.
If you don't know something, admit it gracefully.`;

/**
 * Stream chat response from Claude
 */
export async function streamChat(messages: CoreMessage[]) {
  const config = getAIConfig();

  if (!config.anthropicKey) {
    throw new Error("Anthropic API key not configured");
  }

  try {
    const result = streamText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      messages,
      system: SYSTEM_PROMPT,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    apiLogger.error("AI streamChat error", { error });
    throw error;
  }
}

/**
 * Non-streaming chat (for simple responses)
 */
export async function chat(messages: CoreMessage[]): Promise<string> {
  const config = getAIConfig();

  if (!config.anthropicKey) {
    throw new Error("Anthropic API key not configured");
  }

  try {
    const result = await streamText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      messages,
      system: SYSTEM_PROMPT,
    });

    const response = await result.text;
    return response;
  } catch (error) {
    apiLogger.error("AI chat error", { error });
    throw error;
  }
}

export const aiService = {
  streamChat,
  chat,
};

export type AIService = typeof aiService;
```

---

### 3.8 Health Service

**File:** `packages/frontend/src/server/services/health.service.ts`

```typescript
import { prisma, testDatabaseConnection, getDatabaseInfo } from "../db";
import { redisService } from "../redis";

export interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded";
  responseTime: number;
  lastChecked: string;
  details?: Record<string, unknown>;
  error?: string;
}

export interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    memory: HealthCheck;
  };
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const result = await testDatabaseConnection();
    const info = result.connected ? await getDatabaseInfo() : null;

    return {
      status: result.connected ? "healthy" : "unhealthy",
      responseTime: result.latency,
      lastChecked: new Date().toISOString(),
      details: info ?? undefined,
      error: result.error,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check Redis health
 */
async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const result = await redisService.testConnection();

    return {
      status: result.status === "connected" ? "healthy" : "unhealthy",
      responseTime: result.responseTime,
      lastChecked: new Date().toISOString(),
      error: result.error,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const start = Date.now();
  const memUsage = process.memoryUsage();
  const usedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  let status: HealthCheck["status"] = "healthy";
  if (usedPercent > 90) status = "unhealthy";
  else if (usedPercent > 75) status = "degraded";

  return {
    status,
    responseTime: Date.now() - start,
    lastChecked: new Date().toISOString(),
    details: {
      heapUsed: formatBytes(memUsage.heapUsed),
      heapTotal: formatBytes(memUsage.heapTotal),
      rss: formatBytes(memUsage.rss),
      usagePercent: Math.round(usedPercent * 100) / 100,
    },
  };
}

function formatBytes(bytes: number): string {
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Perform comprehensive health check
 */
export async function checkHealth(): Promise<HealthCheckResult> {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
  const memory = checkMemory();

  const checks = { database, redis, memory };
  const checkValues = Object.values(checks);

  let status: HealthCheckResult["status"] = "healthy";
  if (checkValues.some((c) => c.status === "unhealthy")) {
    status = "unhealthy";
  } else if (checkValues.some((c) => c.status === "degraded")) {
    status = "degraded";
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    checks,
  };
}

/**
 * Simple ping check
 */
export async function ping(): Promise<{ message: string; timestamp: string }> {
  return {
    message: "pong",
    timestamp: new Date().toISOString(),
  };
}

export const healthService = {
  checkHealth,
  ping,
  checkDatabase,
  checkRedis,
  checkMemory,
};

export type HealthService = typeof healthService;
```

---

### 3.9 Create Services Index

**File:** `packages/frontend/src/server/services/index.ts`

```typescript
export { authService, type AuthService, type AuthUser } from "./auth.service";
export { securityService, type SecurityService } from "./security.service";
export {
  auditLogService,
  type AuditLogService,
  AuditEventType,
} from "./audit-log.service";
export { blogService, type BlogService } from "./blog.service";
export { projectsService, type ProjectsService } from "./projects.service";
export { spotifyService, type SpotifyService } from "./spotify.service";
export { aiService, type AIService } from "./ai.service";
export { healthService, type HealthService } from "./health.service";
```

---

## ✅ Phase 3 Verification

### Verification Checklist

- [ ] All service files created in `src/server/services/`
- [ ] No NestJS imports (`@nestjs/*`) in new files
- [ ] All services use function-based exports
- [ ] Types properly defined and exported
- [ ] Redis service used for caching
- [ ] Prisma client used for database
- [ ] Logger used for debugging
- [ ] TypeScript compilation passes

### Test Commands

```bash
# Type check
bun run type-check

# Run service tests (create test files)
bun run test:services
```

---

## ➡️ Next Step

Proceed to **[Phase 4: API Routes & tRPC Migration](./phase-4-api-routes.md)**
