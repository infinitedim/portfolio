import { Injectable, BadRequestException } from "@nestjs/common";
import crypto from "crypto";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { RedisService } from "../redis/redis.service";
import { env } from "../env.config";
export var SecurityEventType;
(function (SecurityEventType) {
  SecurityEventType["CSP_VIOLATION"] = "csp_violation";
  SecurityEventType["RATE_LIMIT_EXCEEDED"] = "rate_limit_exceeded";
  SecurityEventType["INVALID_TOKEN"] = "invalid_token";
  SecurityEventType["SUSPICIOUS_REQUEST"] = "suspicious_request";
  SecurityEventType["BLOCKED_REQUEST"] = "blocked_request";
  SecurityEventType["SQL_INJECTION_ATTEMPT"] = "sql_injection_attempt";
  SecurityEventType["XSS_ATTEMPT"] = "xss_attempt";
  SecurityEventType["BRUTE_FORCE_ATTEMPT"] = "brute_force_attempt";
  SecurityEventType["PATH_TRAVERSAL_ATTEMPT"] = "path_traversal_attempt";
})(SecurityEventType || (SecurityEventType = {}));
// ============================================================================
// SECURITY SERVICE
// ============================================================================
@Injectable()
export class SecurityService {
  redisService;
  // JWT Configuration - using validated environment
  JWT_SECRET = env.JWT_SECRET;
  JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;
  REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;
  REFRESH_TOKEN_EXPIRES_IN = env.REFRESH_TOKEN_EXPIRES_IN;
  JWT_ALGORITHM = "HS512"; // Stronger algorithm
  JWT_ISSUER = env.JWT_ISSUER;
  JWT_AUDIENCE = env.JWT_AUDIENCE;
  rateLimitConfigs = {
    login: {
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: "Too many login attempts. Please try again later.",
      statusCode: 429,
      blockDuration: 30 * 60 * 1000, // 30 minutes
    },
    register: {
      windowMs: 60 * 60 * 1000,
      max: 3,
      message: "Too many registration attempts. Please try again later.",
      statusCode: 429,
      blockDuration: 60 * 60 * 1000, // 1 hour
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000,
      max: 3,
      message: "Too many password reset attempts. Please try again later.",
      statusCode: 429,
      blockDuration: 60 * 60 * 1000, // 1 hour
    },
    api: {
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: "Too many API requests. Please try again later.",
      statusCode: 429,
      blockDuration: 15 * 60 * 1000, // 15 minutes
    },
    admin: {
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: "Too many admin requests. Please try again later.",
      statusCode: 429,
      blockDuration: 30 * 60 * 1000, // 30 minutes
    },
    public: {
      windowMs: 15 * 60 * 1000,
      max: 300,
      message: "Too many requests. Please try again later.",
      statusCode: 429,
      blockDuration: 15 * 60 * 1000, // 15 minutes
    },
    upload: {
      windowMs: 60 * 60 * 1000,
      max: 10,
      message: "Too many file uploads. Please try again later.",
      statusCode: 429,
      blockDuration: 60 * 60 * 1000, // 1 hour
    },
    // Medium priority: Additional rate limits
    email: {
      windowMs: 60 * 60 * 1000,
      max: 5,
      message: "Too many email requests. Please try again later.",
      statusCode: 429,
      blockDuration: 60 * 60 * 1000, // 1 hour
    },
    search: {
      windowMs: 5 * 60 * 1000,
      max: 50,
      message: "Too many search requests. Please try again later.",
      statusCode: 429,
      blockDuration: 10 * 60 * 1000, // 10 minutes
    },
    // Low priority: Strict rate limits for sensitive operations
    sensitive: {
      windowMs: 5 * 60 * 1000,
      max: 2,
      message: "Too many sensitive operations. Please try again later.",
      statusCode: 429,
      blockDuration: 60 * 60 * 1000, // 1 hour
    },
  };
  securityConfig = {
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
      // SQL Injection patterns
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i,
      // Command injection patterns
      /;\s*rm\s/i,
      /;\s*curl\s/i,
      /;\s*wget\s/i,
      /&&\s*(rm|curl|wget)/i,
      /\|\s*(rm|curl|wget)/i,
      // Path traversal patterns
      /\.\.\//,
      /\.\.\\/,
      // Other dangerous patterns
      /base64_decode/i,
      /system\s*\(/i,
      /exec\s*\(/i,
      /shell_exec/i,
    ],
    rateLimitThreshold: 10,
  };
  // Zod schemas for validation
  schemas = {
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
  constructor(redisService) {
    this.redisService = redisService;
  }
  // ============================================================================
  // JWT AUTHENTICATION
  // ============================================================================
  /**
   * Generate JWT access token with enhanced security
   * @param {Omit<JWTPayload, "iat" | "exp" | "iss" | "aud" | "jti">} payload - The payload for the JWT
   * @returns {string} The generated JWT access token
   */
  generateAccessToken(payload) {
    const jti = crypto.randomUUID(); // Unique token identifier
    const options = {
      expiresIn: this.JWT_EXPIRES_IN,
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
   * @returns {string} The generated JWT refresh token
   */
  generateRefreshToken(userId) {
    const tokenId = crypto.randomUUID();
    const jti = crypto.randomUUID();
    const payload = {
      userId,
      tokenId,
    };
    const options = {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
      algorithm: this.JWT_ALGORITHM,
      issuer: this.JWT_ISSUER,
      audience: this.JWT_AUDIENCE,
      jwtid: jti,
    };
    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, options);
  }
  /**
   * Verify JWT access token with enhanced security
   * @param {string} token - The JWT access token to verify
   * @returns {JWTPayload} The verified JWT payload
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        algorithms: [this.JWT_ALGORITHM],
        issuer: this.JWT_ISSUER,
        audience: this.JWT_AUDIENCE,
      });
    } catch (error) {
      console.error("Error verifying access token:", error);
      throw new Error("Invalid or expired access token");
    }
  }
  /**
   * Verify JWT refresh token with enhanced security
   * @param {string} token - The JWT refresh token to verify
   * @returns {RefreshTokenPayload} The verified JWT refresh token payload
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.REFRESH_TOKEN_SECRET, {
        algorithms: [this.JWT_ALGORITHM],
        issuer: this.JWT_ISSUER,
        audience: this.JWT_AUDIENCE,
      });
    } catch (error) {
      console.error("Error verifying refresh token:", error);
      throw new Error("Invalid or expired refresh token");
    }
  }
  /**
   * Hash password with bcrypt using stronger settings
   * @param {string} password - The password to hash
   * @returns {Promise<string>} The hashed password
   */
  async hashPassword(password) {
    const saltRounds = 14; // Increased from 12 for better security
    return bcrypt.hash(password, saltRounds);
  }
  /**
   * Verify password with bcrypt
   * @param {string} password - The password to verify
   * @param {string} hash - The hash to verify against
   * @returns {Promise<boolean>} True if the password is valid, false otherwise
   */
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
  /**
   * Generate secure API key with enhanced entropy
   * @returns {string} The generated API key
   */
  generateApiKey() {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(32).toString("hex"); // Increased entropy
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
  verifyApiKey(apiKey, storedHash) {
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
      console.error("Error verifying API key:", error);
      return false;
    }
  }
  /**
   * Create CSRF token with enhanced entropy
   * @returns {string} The generated CSRF token
   */
  generateCSRFToken() {
    return crypto.randomBytes(64).toString("hex"); // Increased entropy
  }
  /**
   * Verify CSRF token with timing-safe comparison
   * @param {string} token - The CSRF token to verify
   * @param {string} sessionToken - The session token to verify against
   * @returns {boolean} True if the CSRF token is valid, false otherwise
   */
  verifyCSRFToken(token, sessionToken) {
    // Ensure both tokens are valid hex strings
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
  extractJWTId(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded.jti || null;
    } catch {
      return null;
    }
  }
  // ============================================================================
  // RATE LIMITING
  // ============================================================================
  async checkRateLimit(key, type) {
    const config = this.rateLimitConfigs[type] || this.rateLimitConfigs.public;
    if (!config) {
      throw new Error(`Unknown rate limit type: ${type}`);
    }
    const now = Date.now();
    const windowKey = `rate_limit:${type}:${key}:${Math.floor(now / config.windowMs)}`;
    const blockKey = `blocked:${type}:${key}`;
    try {
      // Check if key is blocked
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
      // Increment request count
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
      // Check if limit exceeded
      if (current > config.max) {
        // Block the key if block duration is configured
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
      console.error("Rate limit check failed:", error);
      // Fail open - allow request if Redis is down
      return {
        isBlocked: false,
        remaining: config.max,
        resetTime: now + config.windowMs,
      };
    }
  }
  async getRateLimitInfo(key, type) {
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
      console.error("Rate limit info failed:", error);
      return {
        current: 0,
        limit: config.max,
        remaining: config.max,
        resetTime: now + config.windowMs,
        isBlocked: false,
      };
    }
  }
  async resetRateLimit(key, type) {
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
      console.error("Rate limit reset failed:", error);
    }
  }
  async blockKey(key, duration) {
    try {
      await this.redisService.set(key, "1", Math.ceil(duration / 1000));
    } catch (error) {
      console.error("Block key failed:", error);
    }
  }
  async isKeyBlocked(key) {
    try {
      const exists = await this.redisService.exists(`blocked:${key}`);
      return exists === true;
    } catch (error) {
      console.error("Check blocked key failed:", error);
      return false;
    }
  }
  async getBlockedKeys(pattern = "blocked:*") {
    try {
      return await this.redisService.keys(pattern);
    } catch (error) {
      console.error("Get blocked keys failed:", error);
      return [];
    }
  }
  async unblockKey(key) {
    try {
      await this.redisService.del(key);
    } catch (error) {
      console.error("Unblock key failed:", error);
    }
  }
  async getRateLimitStats() {
    try {
      const keys = await this.redisService.keys("rate_limit:*");
      const stats = {};
      for (const key of keys) {
        const parts = key.split(":");
        const type = parts[1];
        if (type) {
          stats[type] = (stats[type] || 0) + 1;
        }
      }
      return stats;
    } catch (error) {
      console.error("Get rate limit stats failed:", error);
      return {};
    }
  }
  async cleanupExpiredKeys() {
    try {
      const keys = await this.redisService.keys("rate_limit:*");
      let cleaned = 0;
      for (const key of keys) {
        const ttl = await this.redisService.ttl(key);
        if (ttl === -1) {
          // No expiry set
          await this.redisService.del(key);
          cleaned++;
        }
      }
      return cleaned;
    } catch (error) {
      console.error("Cleanup expired keys failed:", error);
      return 0;
    }
  }
  // ============================================================================
  // INPUT VALIDATION
  // ============================================================================
  validate(schema, data) {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException(
          `Validation failed: ${error.errors[0]?.message}`,
        );
      }
      throw error;
    }
  }
  validateEmail(email) {
    return this.validate(this.schemas.email, email);
  }
  validatePassword(password) {
    return this.validate(this.schemas.password, password);
  }
  validateUsername(username) {
    return this.validate(this.schemas.username, username);
  }
  validateName(name) {
    return this.validate(this.schemas.name, name);
  }
  validateUrl(url) {
    return this.validate(this.schemas.url, url);
  }
  validateContent(content) {
    return this.validate(this.schemas.content, content);
  }
  validateTitle(title) {
    return this.validate(this.schemas.title, title);
  }
  sanitizeText(text) {
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
  hasSqlInjectionPatterns(input) {
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
  hasXssPatterns(input) {
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
  securityCheck(input) {
    if (this.hasSqlInjectionPatterns(input)) {
      throw new BadRequestException("SQL injection attempt detected");
    }
    if (this.hasXssPatterns(input)) {
      throw new BadRequestException("XSS attempt detected");
    }
  }
  validateCommand(input) {
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
  // ============================================================================
  // ENCRYPTION & HASHING
  // ============================================================================
  ALGORITHM = "aes-256-gcm";
  KEY_LENGTH = 32;
  IV_LENGTH = 16;
  TAG_LENGTH = 16;
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, this.KEY_LENGTH, "sha512");
  }
  encrypt(data, password) {
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
  decrypt(encryptedData, password) {
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
  hashData(data, salt) {
    const saltBuffer = salt ? Buffer.from(salt, "hex") : crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(data, saltBuffer, 100000, 64, "sha512");
    return `${saltBuffer.toString("hex")}:${hash.toString("hex")}`;
  }
  verifyHash(data, hashedData) {
    try {
      const [salt, originalHash] = hashedData.split(":");
      if (!salt || !originalHash) {
        throw new Error("Invalid hashed data format");
      }
      const newHash = crypto.pbkdf2Sync(
        data,
        Buffer.from(salt, "hex"),
        100000,
        64,
        "sha512",
      );
      const originalHashBuffer = Buffer.from(originalHash, "hex");
      if (originalHashBuffer.length !== newHash.length) {
        return false;
      }
      return crypto.timingSafeEqual(originalHashBuffer, newHash);
    } catch (error) {
      console.error("Error verifying hash:", error);
      return false;
    }
  }
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }
  createSignature(data, secret) {
    const key = secret || this.JWT_SECRET;
    return crypto.createHmac("sha256", key).update(data).digest("hex");
  }
  verifySignature(data, signature, secret) {
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
      console.error("Error verifying signature:", error);
      return false;
    }
  }
  encryptObject(obj, password) {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString, password);
  }
  decryptObject(encryptedData, password) {
    const jsonString = this.decrypt(encryptedData, password);
    return JSON.parse(jsonString);
  }
  // ============================================================================
  // SECURITY HEADERS & CSP
  // ============================================================================
  generateNonce() {
    return crypto.randomBytes(16).toString("base64");
  }
  createCSPHeader(nonce, isDevelopment = false) {
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
  getSecurityHeaders(nonce, isDevelopment = false) {
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
  getCORSHeaders(origin, allowedOrigins) {
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
  getRateLimitHeaders(remaining, limit, resetTime) {
    const resetTimeSeconds = Math.ceil(resetTime / 1000);
    const resetTimeDate = new Date(resetTime).toISOString();
    return {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": resetTimeSeconds.toString(),
      "X-RateLimit-Reset-Date": resetTimeDate,
      "X-RateLimit-Window": "60", // 60 seconds window
      "X-RateLimit-Policy": "fixed-window",
      "Retry-After": remaining === 0 ? resetTimeSeconds.toString() : "0",
    };
  }
  // ============================================================================
  // SECURITY MONITORING & LOGGING
  // ============================================================================
  logSecurityEvent(type, request, details) {
    const event = {
      type,
      timestamp: new Date().toISOString(),
      ip: this.getClientIp(request),
      userAgent: request.headers["user-agent"],
      url: request.url,
      method: request.method,
      details,
    };
    if (env.NODE_ENV === "production") {
      // TODO: Send to monitoring service (Sentry, DataDog, etc.)
      console.error("Security Event:", event);
    } else {
      console.warn("Security Event:", event);
    }
  }
  sanitizeForLogging(obj) {
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
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((sensitive) =>
        lowerKey.includes(sensitive),
      );
      if (isSensitive) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeForLogging(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  getClientIp(request) {
    return (
      request.headers["x-forwarded-for"]?.split(",")[0] ||
      request.headers["x-real-ip"] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      "Unknown"
    );
  }
  getRateLimitType(request) {
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
  applySecurityHeaders(response, nonce, isDevelopment = false) {
    const headers = this.getSecurityHeaders(nonce, isDevelopment);
    for (const [key, value] of Object.entries(headers)) {
      response.setHeader(key, value);
    }
  }
  // ============================================================================
  // SECURE STORAGE WRAPPER
  // ============================================================================
  createSecureStorage(password) {
    const storagePassword = password || this.JWT_SECRET;
    return {
      store: (key, data) => {
        return this.encryptObject(data, storagePassword);
      },
      retrieve: (encryptedData) => {
        return this.decryptObject(encryptedData, storagePassword);
      },
      createSession: (userId, data = {}) => {
        const sessionData = {
          userId,
          createdAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          ...data,
        };
        return this.encryptObject(sessionData, storagePassword);
      },
      validateSession: (encryptedSession) => {
        try {
          const sessionData = this.decryptObject(
            encryptedSession,
            storagePassword,
          );
          if (Date.now() > sessionData.expiresAt) {
            return null; // Session expired
          }
          const { userId, ...data } = sessionData;
          return { userId, data };
        } catch (error) {
          console.error("Error validating session:", error);
          return null; // Invalid session
        }
      },
    };
  }
}
