import {Injectable, BadRequestException} from "@nestjs/common";
import type {Request, Response} from "express";
import crypto from "crypto";
import {z} from "zod";
import jwt, {type Algorithm, type SignOptions} from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {RedisService} from "../redis/redis.service";
import {getEnv} from "../env.config";
import {securityLogger} from "../logging/logger";

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

export interface SecurityConfig {
  maxInputLength: number;
  allowedCommands: string[];
  dangerousPatterns: RegExp[];
  rateLimitThreshold: number;
}

export interface SecurityHeaders {
  [key: string]: string;
}

export interface SecurityEvent {
  type: string;
  timestamp: string;
  ip: string;
  userAgent?: string;
  url: string;
  method: string;
  details?: Record<string, unknown>;
}

export enum SecurityEventType {
  CSP_VIOLATION = "csp_violation",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  INVALID_TOKEN = "invalid_token",
  SUSPICIOUS_REQUEST = "suspicious_request",
  BLOCKED_REQUEST = "blocked_request",
  SQL_INJECTION_ATTEMPT = "sql_injection_attempt",
  XSS_ATTEMPT = "xss_attempt",
  BRUTE_FORCE_ATTEMPT = "brute_force_attempt",
  PATH_TRAVERSAL_ATTEMPT = "path_traversal_attempt",
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
  /** Token family ID for rotation tracking - all tokens in a chain share the same familyId */
  familyId: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  jti?: string;
}

const inMemoryRateLimits = new Map<
  string,
  {count: number; resetTime: number}
>();

@Injectable()
export class SecurityService {
  private readonly JWT_SECRET = getEnv().JWT_SECRET;
  private readonly JWT_EXPIRES_IN = getEnv().JWT_EXPIRES_IN;
  private readonly REFRESH_TOKEN = getEnv().REFRESH_TOKEN;
  private readonly REFRESH_TOKEN_EXPIRES_IN = getEnv().REFRESH_TOKEN_EXPIRES_IN;
  private readonly JWT_ALGORITHM: Algorithm = "HS512";
  private readonly JWT_ISSUER = getEnv().JWT_ISSUER;
  private readonly JWT_AUDIENCE = getEnv().JWT_AUDIENCE;

  private readonly rateLimitConfigs: Record<string, RateLimitConfig> = {
    login: {
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: "Too many login attempts. Please try again later.",
      statusCode: 429,
      blockDuration: 30 * 60 * 1000,
    },
    register: {
      windowMs: 60 * 60 * 1000,
      max: 3,
      message: "Too many registration attempts. Please try again later.",
      statusCode: 429,
      blockDuration: 60 * 60 * 1000,
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000,
      max: 3,
      message: "Too many password reset attempts. Please try again later.",
      statusCode: 429,
      blockDuration: 60 * 60 * 1000,
    },
    api: {
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: "Too many API requests. Please try again later.",
      statusCode: 429,
      blockDuration: 15 * 60 * 1000,
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
      blockDuration: 15 * 60 * 1000,
    },
    upload: {
      windowMs: 60 * 60 * 1000,
      max: 10,
      message: "Too many file uploads. Please try again later.",
      statusCode: 429,
      blockDuration: 60 * 60 * 1000,
    },
    email: {
      windowMs: 60 * 60 * 1000,
      max: 5,
      message: "Too many email requests. Please try again later.",
      statusCode: 429,
      blockDuration: 60 * 60 * 1000,
    },
    search: {
      windowMs: 5 * 60 * 1000,
      max: 50,
      message: "Too many search requests. Please try again later.",
      statusCode: 429,
      blockDuration: 10 * 60 * 1000,
    },
    sensitive: {
      windowMs: 5 * 60 * 1000,
      max: 2,
      message: "Too many sensitive operations. Please try again later.",
      statusCode: 429,
      blockDuration: 60 * 60 * 1000,
    },
  };

  private readonly securityConfig: SecurityConfig = {
    maxInputLength: 1000,
    allowedCommands: [
      "help",
      "about",
      "skills",
      "projects",
      "contact",
      "theme",
      "font",
      "clear",
      "customize",
      "themes",
      "fonts",
      "status",
      "alias",
      "roadmap",
      "experience",
      "education",
      "demo",
      "github",
      "tech-stack",
      "now-playing",
      "location",
    ],
    dangerousPatterns: [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /Function\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
      /document\./i,
      /window\./i,
      /alert\s*\(/i,
      /confirm\s*\(/i,
      /prompt\s*\(/i,
      /fetch\s*\(/i,
      /XMLHttpRequest/i,
      /\.innerHTML/i,
      /\.outerHTML/i,
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i,
      /;\s*rm\s/i,
      /;\s*curl\s/i,
      /;\s*wget\s/i,
      /&&\s*(rm|curl|wget)/i,
      /\|\s*(rm|curl|wget)/i,
      /\.\.\//,
      /\.\.\\/,
      /base64_decode/i,
      /system\s*\(/i,
      /exec\s*\(/i,
      /shell_exec/i,
    ],
    rateLimitThreshold: 10,
  };

  private readonly schemas = {
    email: z
      .string()
      .email()
      .transform((val) => val.trim().toLowerCase()),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/^[a-zA-Z0-9@$!%*?&]+$/, "Password contains invalid characters"),
    username: z
      .string()
      .min(3)
      .max(50)
      .regex(/^[a-zA-Z0-9_-]+$/, "Username contains invalid characters"),
    name: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
    url: z.string().url(),
    content: z.string().min(1).max(10000),
    title: z.string().min(1).max(200),
  };

  constructor(private readonly redisService: RedisService) {}

  private readonly securityLogger = securityLogger;

  /**
   * Generate JWT access token with enhanced security
   * @param {Omit<JWTPayload, "iat" | "exp" | "iss" | "aud" | "jti">} payload - The payload for the JWT
   * @returns {string} The generated JWT access token
   */
  generateAccessToken(
    payload: Omit<JWTPayload, "iat" | "exp" | "iss" | "aud" | "jti">,
  ): string {
    const jti = crypto.randomUUID();
    const options: SignOptions = {
      expiresIn: this.JWT_EXPIRES_IN as SignOptions["expiresIn"],
      algorithm: this.JWT_ALGORITHM,
      issuer: this.JWT_ISSUER,
      audience: this.JWT_AUDIENCE,
      jwtid: jti,
    };

    return jwt.sign(payload, this.JWT_SECRET, options);
  }

  /**
   * Generate JWT refresh token with enhanced security
   * @param {string} userId - The user ID for the refresh token
   * @param {string} familyId - Optional family ID for token rotation tracking (new family if not provided)
   * @returns {string} The generated JWT refresh token
   */
  generateRefreshToken(userId: string, familyId?: string): string {
    const tokenId = crypto.randomUUID();
    const jti = crypto.randomUUID();
    const tokenFamilyId = familyId ?? crypto.randomUUID();
    const payload: Omit<
      RefreshTokenPayload,
      "iat" | "exp" | "iss" | "aud" | "jti"
    > = {
      userId,
      tokenId,
      familyId: tokenFamilyId,
    };

    const options: SignOptions = {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
      algorithm: this.JWT_ALGORITHM,
      issuer: this.JWT_ISSUER,
      audience: this.JWT_AUDIENCE,
      jwtid: jti,
    };

    return jwt.sign(payload, this.REFRESH_TOKEN, options);
  }

  /**
   * Verify JWT access token with enhanced security
   * @param {string} token - The JWT access token to verify
   * @returns {JWTPayload} The verified JWT payload
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        algorithms: [this.JWT_ALGORITHM],
        issuer: this.JWT_ISSUER,
        audience: this.JWT_AUDIENCE,
      }) as JWTPayload;
    } catch (error) {
      securityLogger.error("Error verifying access token", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Invalid or expired access token");
    }
  }

  /**
   * Verify JWT refresh token with enhanced security
   * @param {string} token - The JWT refresh token to verify
   * @returns {RefreshTokenPayload} The verified JWT refresh token payload
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, this.REFRESH_TOKEN, {
        algorithms: [this.JWT_ALGORITHM],
        issuer: this.JWT_ISSUER,
        audience: this.JWT_AUDIENCE,
      }) as RefreshTokenPayload;
    } catch (error) {
      securityLogger.error("Error verifying refresh token", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Invalid or expired refresh token");
    }
  }

  /**
   * Hash password with bcrypt using stronger settings
   * @param {string} password - The password to hash
   * @returns {Promise<string>} The hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 14;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password with bcrypt
   * @param {string} password - The password to verify
   * @param {string} hash - The hash to verify against
   * @returns {Promise<boolean>} True if the password is valid, false otherwise
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate secure API key with enhanced entropy
   * @returns {string} The generated API key
   */
  generateApiKey(): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(32).toString("hex");
    const combined = `${timestamp}-${randomBytes}`;

    return crypto
      .createHmac("sha512", this.JWT_SECRET)
      .update(combined)
      .digest("hex");
  }

  /**
   * Verify API key with HMAC using timing-safe comparison
   * @param {string} apiKey - The API key to verify
   * @param {string} storedHash - The stored hash to verify against
   * @returns {boolean} True if the API key is valid, false otherwise
   */
  verifyApiKey(apiKey: string, storedHash: string): boolean {
    try {
      const hash = crypto
        .createHmac("sha512", this.JWT_SECRET)
        .update(apiKey)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(hash, "hex"),
        Buffer.from(storedHash, "hex"),
      );
    } catch (error) {
      securityLogger.error("Error verifying API key", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }

  /**
   * Create CSRF token with enhanced entropy
   * @returns {string} The generated CSRF token
   */
  generateCSRFToken(): string {
    return crypto.randomBytes(64).toString("hex");
  }

  /**
   * Verify CSRF token with timing-safe comparison
   * @param {string} token - The CSRF token to verify
   * @param {string} sessionToken - The session token to verify against
   * @returns {boolean} True if the CSRF token is valid, false otherwise
   */
  verifyCSRFToken(token: string, sessionToken: string): boolean {
    if (!/^[0-9a-fA-F]+$/.test(token) || !/^[0-9a-fA-F]+$/.test(sessionToken)) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(token, "hex"),
      Buffer.from(sessionToken, "hex"),
    );
  }

  /**
   * Extract JWT ID from token for tracking
   * @param {string} token - The JWT token
   * @returns {string | null} The JWT ID or null if invalid
   */
  extractJWTId(token: string): string | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded.jti || null;
    } catch {
      return null;
    }
  }

  async checkRateLimit(key: string, type: string): Promise<RateLimitResult> {
    const config = this.rateLimitConfigs[type] || this.rateLimitConfigs.public;
    if (!config) {
      throw new Error(`Unknown rate limit type: ${type}`);
    }

    const now = Date.now();
    const windowKey = `rate_limit:${type}:${key}:${Math.floor(now / config.windowMs)}`;
    const blockKey = `blocked:${type}:${key}`;

    try {
      const isBlocked = await this.isKeyBlocked(blockKey);
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

      const current = await this.redisService.incr(windowKey);
      if (current === 1) {
        await this.redisService.expire(
          windowKey,
          Math.ceil(config.windowMs / 1000),
        );
      }

      const remaining = Math.max(0, config.max - current);
      const resetTime =
        (Math.floor(now / config.windowMs) + 1) * config.windowMs;

      if (current > config.max) {
        if (config.blockDuration) {
          await this.blockKey(blockKey, config.blockDuration);
        }

        const retryAfter = Math.ceil((resetTime - now) / 1000);
        return {
          isBlocked: true,
          remaining: 0,
          resetTime,
          retryAfter,
          message: config.message,
          statusCode: config.statusCode,
        };
      }

      return {
        isBlocked: false,
        remaining,
        resetTime,
      };
    } catch (error) {
      securityLogger.error("Rate limit check failed", {
        error: error instanceof Error ? error.message : String(error),
        key,
        type,
        stack: error instanceof Error ? error.stack : undefined,
      });

      const fallbackKey = `${type}:${key}`;
      const now = Date.now();
      const fallbackData = inMemoryRateLimits.get(fallbackKey);

      if (inMemoryRateLimits.size > 10000) {
        for (const [k, v] of inMemoryRateLimits.entries()) {
          if (v.resetTime < now) inMemoryRateLimits.delete(k);
        }
      }

      if (fallbackData && fallbackData.resetTime > now) {
        fallbackData.count++;
        if (fallbackData.count > config.max) {
          return {
            isBlocked: true,
            remaining: 0,
            resetTime: fallbackData.resetTime,
            retryAfter: Math.ceil((fallbackData.resetTime - now) / 1000),
            message: config.message,
            statusCode: config.statusCode,
          };
        }
        return {
          isBlocked: false,
          remaining: Math.max(0, config.max - fallbackData.count),
          resetTime: fallbackData.resetTime,
        };
      } else {
        inMemoryRateLimits.set(fallbackKey, {
          count: 1,
          resetTime: now + config.windowMs,
        });
        return {
          isBlocked: false,
          remaining: config.max - 1,
          resetTime: now + config.windowMs,
        };
      }
    }
  }

  async getRateLimitInfo(key: string, type: string): Promise<RateLimitInfo> {
    const config = this.rateLimitConfigs[type] || this.rateLimitConfigs.public;
    if (!config) {
      throw new Error(`Unknown rate limit type: ${type}`);
    }

    const now = Date.now();
    const windowKey = `rate_limit:${type}:${key}:${Math.floor(now / config.windowMs)}`;
    const blockKey = `blocked:${type}:${key}`;

    try {
      const current = parseInt((await this.redisService.get(windowKey)) || "0");
      const isBlocked = await this.isKeyBlocked(blockKey);
      const remaining = Math.max(0, config.max - current);
      const resetTime =
        (Math.floor(now / config.windowMs) + 1) * config.windowMs;

      return {
        current,
        limit: config.max,
        remaining,
        resetTime,
        isBlocked,
      };
    } catch (error) {
      securityLogger.error("Rate limit info failed", {
        error: error instanceof Error ? error.message : String(error),
        key,
        type,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        current: 0,
        limit: config.max,
        remaining: config.max,
        resetTime: now + config.windowMs,
        isBlocked: false,
      };
    }
  }

  async resetRateLimit(key: string, type: string): Promise<void> {
    const now = Date.now();
    const config = this.rateLimitConfigs[type] || this.rateLimitConfigs.public;
    if (!config) {
      throw new Error(`Unknown rate limit type: ${type}`);
    }

    const windowKey = `rate_limit:${type}:${key}:${Math.floor(now / config.windowMs)}`;
    const blockKey = `blocked:${type}:${key}`;

    try {
      await this.redisService.del(windowKey);
      await this.redisService.del(blockKey);
    } catch (error) {
      securityLogger.error("Rate limit reset failed", {
        error: error instanceof Error ? error.message : String(error),
        key,
        type,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  async blockKey(key: string, duration: number): Promise<void> {
    try {
      await this.redisService.set(key, "1", Math.ceil(duration / 1000));
    } catch (error) {
      securityLogger.error("Block key failed", {
        error: error instanceof Error ? error.message : String(error),
        key,
        duration,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  async isKeyBlocked(key: string): Promise<boolean> {
    try {
      const exists = await this.redisService.exists(`blocked:${key}`);
      return exists === true;
    } catch (error) {
      securityLogger.error("Check blocked key failed", {
        error: error instanceof Error ? error.message : String(error),
        key,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }

  async getBlockedKeys(pattern: string = "blocked:*"): Promise<string[]> {
    try {
      return await this.redisService.keys(pattern);
    } catch (error) {
      securityLogger.error("Get blocked keys failed", {
        error: error instanceof Error ? error.message : String(error),
        pattern,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return [];
    }
  }

  async unblockKey(key: string): Promise<void> {
    try {
      await this.redisService.del(key);
    } catch (error) {
      securityLogger.error("Unblock key failed", {
        error: error instanceof Error ? error.message : String(error),
        key,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  async getRateLimitStats(): Promise<Record<string, number>> {
    try {
      const keys = await this.redisService.keys("rate_limit:*");
      const stats: Record<string, number> = {};

      for (const key of keys) {
        const parts = key.split(":");
        const type = parts[1];
        if (type) {
          stats[type] = (stats[type] || 0) + 1;
        }
      }

      return stats;
    } catch (error) {
      securityLogger.error("Get rate limit stats failed", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {};
    }
  }

  async cleanupExpiredKeys(): Promise<number> {
    try {
      const keys = await this.redisService.keys("rate_limit:*");
      if (keys.length === 0) {
        return 0;
      }

      const pipeline = Array.isArray(keys) ? keys : [];
      const ttlPromises = pipeline.map((key) => this.redisService.ttl(key));
      const ttls = await Promise.all(ttlPromises);

      const keysToDelete: string[] = [];
      ttls.forEach((ttl, index) => {
        if (ttl === -1 && keys[index]) {
          keysToDelete.push(keys[index]);
        }
      });

      if (keysToDelete.length > 0) {
        const deletePromises = keysToDelete.map((key) =>
          this.redisService.del(key),
        );
        await Promise.all(deletePromises);
      }

      return keysToDelete.length;
    } catch (error) {
      this.securityLogger.error("Failed to cleanup expired keys", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: "SecurityService",
        operation: "cleanupExpiredKeys",
      });
      return 0;
    }
  }

  validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException(
          `Validation failed: ${error.issues[0]?.message}`,
        );
      }
      throw error;
    }
  }

  validateEmail(email: string): string {
    return this.validate(this.schemas.email, email);
  }

  validatePassword(password: string): string {
    return this.validate(this.schemas.password, password);
  }

  validateUsername(username: string): string {
    return this.validate(this.schemas.username, username);
  }

  validateName(name: string): string {
    return this.validate(this.schemas.name, name);
  }

  validateUrl(url: string): string {
    return this.validate(this.schemas.url, url);
  }

  validateContent(content: string): string {
    return this.validate(this.schemas.content, content);
  }

  validateTitle(title: string): string {
    return this.validate(this.schemas.title, title);
  }

  sanitizeText(text: string): string {
    if (typeof text !== "string") return "";

    return (
      text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .replace(/data:text\/html/gi, "")
        .replace(/vbscript:/gi, "")
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
        .replace(/\0/g, "")
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .trim()
    );
  }

  hasSqlInjectionPatterns(input: string): boolean {
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      /(\b(or|and)\b\s+\d+\s*=\s*\d+)/i,
      /(\b(or|and)\b\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?)/i,
      /(--|\/\*|\*\/)/,
      /(\bxp_|sp_)/i,
      /(\bwaitfor\b)/i,
    ];
    return sqlPatterns.some((pattern) => pattern.test(input));
  }

  hasXssPatterns(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    ];
    return xssPatterns.some((pattern) => pattern.test(input));
  }

  securityCheck(input: string): void {
    if (this.hasSqlInjectionPatterns(input)) {
      throw new BadRequestException("SQL injection attempt detected");
    }
    if (this.hasXssPatterns(input)) {
      throw new BadRequestException("XSS attempt detected");
    }
  }

  validateCommand(input: string): ValidationResult {
    const sanitized = this.sanitizeText(input);

    if (!sanitized) {
      return {
        isValid: false,
        sanitized: "",
        error: "Empty command after sanitization",
        riskLevel: "low",
      };
    }

    const parts = sanitized.split(" ");
    const command = parts[0]?.toLowerCase() ?? "";

    if (!this.securityConfig.allowedCommands.includes(command)) {
      return {
        isValid: false,
        sanitized,
        error: `Command '${command}' is not allowed`,
        riskLevel: "medium",
      };
    }

    const dangerousPattern = this.securityConfig.dangerousPatterns.find(
      (pattern) => pattern.test(sanitized),
    );

    if (dangerousPattern) {
      return {
        isValid: false,
        sanitized,
        error: "Potentially dangerous pattern detected",
        riskLevel: "high",
      };
    }

    return {
      isValid: true,
      sanitized,
      error: null,
      riskLevel: "low",
    };
  }

  private readonly ALGORITHM = "aes-256-gcm";
  private readonly KEY_LENGTH = 32;
  private readonly IV_LENGTH = 16;
  private readonly TAG_LENGTH = 16;

  private deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, this.KEY_LENGTH, "sha512");
  }

  encrypt(data: string, password?: string): string {
    try {
      const encryptionKey = password || this.JWT_SECRET;
      const salt = crypto.randomBytes(16);
      const key = this.deriveKey(encryptionKey, salt);
      const iv = crypto.randomBytes(this.IV_LENGTH);

      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
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
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  decrypt(encryptedData: string, password?: string): string {
    try {
      const encryptionKey = password || this.JWT_SECRET;
      const data = Buffer.from(encryptedData, "base64");

      let offset = 0;
      const salt = data.subarray(offset, offset + 16);
      offset += 16;

      const iv = data.subarray(offset, offset + this.IV_LENGTH);
      offset += this.IV_LENGTH;

      const tag = data.subarray(offset, offset + this.TAG_LENGTH);
      offset += this.TAG_LENGTH;

      const encrypted = data.subarray(offset);

      const key = this.deriveKey(encryptionKey, salt);

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      decipher.setAAD(salt);

      let decrypted = decipher.update(encrypted, undefined, "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async hashData(data: string, salt?: string): Promise<string> {
    const saltBuffer = salt ? Buffer.from(salt, "hex") : crypto.randomBytes(16);

    return new Promise((resolve, reject) => {
      crypto.pbkdf2(data, saltBuffer, 100000, 64, "sha512", (err, hash) => {
        if (err) {
          reject(new Error(`Hashing failed: ${err.message}`));
        } else {
          resolve(`${saltBuffer.toString("hex")}:${hash.toString("hex")}`);
        }
      });
    });
  }

  async verifyHash(data: string, hashedData: string): Promise<boolean> {
    try {
      const [salt, originalHash] = hashedData.split(":");
      if (!salt || !originalHash) {
        throw new Error("Invalid hashed data format");
      }

      return new Promise((resolve, reject) => {
        crypto.pbkdf2(
          data,
          Buffer.from(salt, "hex"),
          100000,
          64,
          "sha512",
          (err, newHash) => {
            if (err) {
              reject(new Error(`Hash verification failed: ${err.message}`));
            } else {
              const originalHashBuffer = Buffer.from(originalHash, "hex");

              if (originalHashBuffer.length !== newHash.length) {
                resolve(false);
                return;
              }

              const isValid = crypto.timingSafeEqual(
                originalHashBuffer,
                newHash,
              );
              resolve(isValid);
            }
          },
        );
      });
    } catch (error) {
      this.securityLogger.error("Failed to verify hash", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: "SecurityService",
        operation: "verifyHash",
      });
      return false;
    }
  }

  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  createSignature(data: string, secret?: string): string {
    const key = secret || this.JWT_SECRET;
    return crypto.createHmac("sha256", key).update(data).digest("hex");
  }

  verifySignature(data: string, signature: string, secret?: string): boolean {
    try {
      const key = secret || this.JWT_SECRET;
      const expectedSignature = crypto
        .createHmac("sha256", key)
        .update(data)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex"),
      );
    } catch (error) {
      this.securityLogger.error("Failed to verify signature", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: "SecurityService",
        operation: "verifySignature",
      });
      return false;
    }
  }

  encryptObject<T>(obj: T, password?: string): string {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString, password);
  }

  decryptObject<T>(encryptedData: string, password?: string): T {
    const jsonString = this.decrypt(encryptedData, password);
    return JSON.parse(jsonString) as T;
  }

  generateNonce(): string {
    return crypto.randomBytes(16).toString("base64");
  }

  createCSPHeader(nonce: string, isDevelopment: boolean = false): string {
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' ${isDevelopment ? "'unsafe-eval'" : ""} 'nonce-${nonce}' https://fonts.googleapis.com`,
      `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
      "img-src 'self' blob: data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.github.com",
      "media-src 'self'",
      "object-src 'none'",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
      isDevelopment ? "" : "block-all-mixed-content",
    ].filter(Boolean);

    return cspDirectives.join("; ");
  }

  getSecurityHeaders(nonce: string, isDevelopment = false): SecurityHeaders {
    return {
      "Content-Security-Policy": this.createCSPHeader(nonce, isDevelopment),
      "X-XSS-Protection": "1; mode=block",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": [
        "geolocation=()",
        "microphone=()",
        "camera=()",
        "payment=()",
        "usb=()",
        "bluetooth=()",
        "accelerometer=()",
        "gyroscope=()",
        "magnetometer=()",
      ].join(", "),
      ...(isDevelopment
        ? {}
        : {
            "Strict-Transport-Security":
              "max-age=31536000; includeSubDomains; preload",
          }),
      "Cross-Origin-Embedder-Policy": "credentialless",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-DNS-Prefetch-Control": "on",
      "X-Permitted-Cross-Domain-Policies": "none",
    };
  }

  getCORSHeaders(origin: string, allowedOrigins: string[]): SecurityHeaders {
    const isAllowed =
      allowedOrigins.includes(origin) || allowedOrigins.includes("*");

    if (!isAllowed) {
      return {};
    }

    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token",
        "X-API-Key",
      ].join(", "),
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    };
  }

  getRateLimitHeaders(
    remaining: number,
    limit: number,
    resetTime: number,
  ): SecurityHeaders {
    const resetTimeSeconds = Math.ceil(resetTime / 1000);
    const resetTimeDate = new Date(resetTime).toISOString();

    return {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": resetTimeSeconds.toString(),
      "X-RateLimit-Reset-Date": resetTimeDate,
      "X-RateLimit-Window": "60",
      "X-RateLimit-Policy": "fixed-window",
      "Retry-After": remaining === 0 ? resetTimeSeconds.toString() : "0",
    };
  }

  logSecurityEvent(
    type: SecurityEventType,
    request: Request,
    details?: Record<string, unknown>,
  ): void {
    const event: SecurityEvent = {
      type,
      timestamp: new Date().toISOString(),
      ip: this.getClientIp(request),
      userAgent: request.headers["user-agent"],
      url: request.url,
      method: request.method,
      details,
    };

    if (getEnv().NODE_ENV === "production") {
      this.securityLogger.error("Security event detected", {
        type: event.type,
        timestamp: event.timestamp,
        ip: event.ip,
        userAgent: event.userAgent,
        url: event.url,
        method: event.method,
        details: event.details,
        component: "SecurityService",
        operation: "logSecurityEvent",
      });
    } else {
      this.securityLogger.warn("Security event detected (development)", {
        type: event.type,
        timestamp: event.timestamp,
        ip: event.ip,
        userAgent: event.userAgent,
        url: event.url,
        method: event.method,
        details: event.details,
        component: "SecurityService",
        operation: "logSecurityEvent",
      });
    }
  }

  sanitizeForLogging(obj: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = [
      "password",
      "token",
      "apiKey",
      "secret",
      "key",
      "auth",
      "authorization",
      "cookie",
      "session",
    ];

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((sensitive) =>
        lowerKey.includes(sensitive),
      );

      if (isSensitive) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeForLogging(
          value as Record<string, unknown>,
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  getClientIp(request: Request): string {
    return (
      (request.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      (request.headers["x-real-ip"] as string) ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      "Unknown"
    );
  }

  getRateLimitType(request: Request): string {
    const path = request.path.toLowerCase();

    if (path.includes("/auth/login")) return "login";
    if (path.includes("/auth/register")) return "register";
    if (path.includes("/auth/reset-password")) return "passwordReset";
    if (path.includes("/admin")) return "admin";
    if (path.includes("/upload")) return "upload";
    if (path.includes("/email")) return "email";
    if (path.includes("/search")) return "search";
    if (path.includes("/sensitive")) return "sensitive";
    if (path.includes("/api")) return "api";
    return "public";
  }

  applySecurityHeaders(
    response: Response,
    nonce: string,
    isDevelopment = false,
  ): void {
    const headers = this.getSecurityHeaders(nonce, isDevelopment);

    for (const [key, value] of Object.entries(headers)) {
      response.setHeader(key, value);
    }
  }

  createSecureStorage(password?: string) {
    const storagePassword = password || this.JWT_SECRET;

    return {
      store: <T>(key: string, data: T): string => {
        return this.encryptObject(data, storagePassword);
      },

      retrieve: <T>(encryptedData: string): T => {
        return this.decryptObject<T>(encryptedData, storagePassword);
      },

      createSession: (
        userId: string,
        data: Record<string, unknown> = {},
      ): string => {
        const sessionData = {
          userId,
          createdAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          ...data,
        };
        return this.encryptObject(sessionData, storagePassword);
      },

      validateSession: (
        encryptedSession: string,
      ): {userId: string; data: Record<string, unknown>} | null => {
        try {
          const sessionData = this.decryptObject<{
            userId: string;
            createdAt: number;
            expiresAt: number;
            [key: string]: unknown;
          }>(encryptedSession, storagePassword);

          if (Date.now() > sessionData.expiresAt) {
            return null;
          }

          const {userId, ...data} = sessionData;
          return {userId, data};
        } catch (error) {
          this.securityLogger.error("Failed to validate session", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            component: "SecurityService",
            operation: "validateSession",
          });
          return null;
        }
      },
    };
  }
}
