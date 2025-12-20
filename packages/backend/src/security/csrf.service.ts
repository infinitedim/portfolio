import {Injectable} from "@nestjs/common";
import type {Request, Response} from "express";
import crypto from "crypto";
import {RedisService} from "../redis/redis.service";
import {securityLogger} from "../logging/logger";

/** Extended Request interface with optional session property */
interface ExtendedRequest extends Request {
  session?: {id?: string};
}

export interface CSRFToken {
  token: string;
  expiresAt: number;
}

export interface CSRFValidationResult {
  isValid: boolean;
  error?: string;
}

@Injectable()
export class CSRFTokenService {
  private readonly TOKEN_LENGTH = 32;
  private readonly TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds
  private readonly SESSION_PREFIX = "csrf:";
  private readonly COOKIE_NAME = "csrf-token";
  private readonly HEADER_NAME = "x-csrf-token";

  constructor(private readonly redisService: RedisService) {}

  /**
   * Generate a new CSRF token
   * @param {string} sessionId - The session identifier
   * @returns {Promise<CSRFToken>} - The generated CSRF token
   */
  async generateToken(sessionId: string): Promise<CSRFToken> {
    const token = crypto.randomBytes(this.TOKEN_LENGTH).toString("hex");
    const expiresAt = Date.now() + this.TOKEN_EXPIRY * 1000;

    const csrfToken: CSRFToken = {
      token,
      expiresAt,
    };

    // Store token in Redis with expiry
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await this.redisService.set(key, csrfToken, this.TOKEN_EXPIRY);

    return csrfToken;
  }

  /**
   * Validate a CSRF token using timing-safe comparison
   * @param {string} sessionId - The session identifier
   * @param {string} token - The token to validate
   * @returns {Promise<CSRFValidationResult>} - The validation result
   */
  async validateToken(
    sessionId: string,
    token: string,
  ): Promise<CSRFValidationResult> {
    try {
      // Input validation
      if (!token || typeof token !== "string") {
        return {
          isValid: false,
          error: "Invalid token format",
        };
      }

      const key = `${this.SESSION_PREFIX}${sessionId}`;
      const storedToken = await this.redisService.get<CSRFToken>(key);

      if (!storedToken) {
        return {
          isValid: false,
          error: "CSRF token not found or expired",
        };
      }

      if (Date.now() > storedToken.expiresAt) {
        // Clean up expired token
        await this.redisService.del(key);
        return {
          isValid: false,
          error: "CSRF token expired",
        };
      }

      // Use timing-safe comparison to prevent timing attacks
      // Both tokens must be the same length for timingSafeEqual
      const storedTokenBuffer = Buffer.from(storedToken.token, "hex");
      const providedTokenBuffer = Buffer.from(token, "hex");

      // Check if both are valid hex strings and same length
      if (storedTokenBuffer.length !== providedTokenBuffer.length) {
        return {
          isValid: false,
          error: "CSRF token mismatch",
        };
      }

      const isValid = crypto.timingSafeEqual(
        storedTokenBuffer,
        providedTokenBuffer,
      );

      if (!isValid) {
        return {
          isValid: false,
          error: "CSRF token mismatch",
        };
      }

      return {isValid: true};
    } catch (error) {
      securityLogger.error("CSRF token validation failed", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: "CSRFTokenService",
        operation: "validateToken",
      });
      return {
        isValid: false,
        error: "CSRF validation failed",
      };
    }
  }

  /**
   * Set CSRF token in response cookie
   * @param {Response} response - Express response object
   * @param {string} token - The CSRF token
   * @param {boolean} isSecure - Whether to set secure cookie (HTTPS)
   */
  setTokenCookie(
    response: Response,
    token: string,
    isSecure: boolean = false,
  ): void {
    response.cookie(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "strict",
      maxAge: this.TOKEN_EXPIRY * 1000,
      path: "/",
    });
  }

  /**
   * Extract CSRF token from request
   * @param {Request} request - Express request object
   * @returns {string | null} - The CSRF token
   */
  extractTokenFromRequest(request: Request): string | null {
    // Check header first (for AJAX requests)
    const headerToken = request.headers[this.HEADER_NAME] as string;
    if (headerToken) {
      return headerToken;
    }

    // Check cookie (for form submissions)
    const cookieToken = request.cookies?.[this.COOKIE_NAME];
    if (cookieToken) {
      return cookieToken;
    }

    // Check body for form data
    const bodyToken = request.body?._csrf;
    if (bodyToken) {
      return bodyToken;
    }

    return null;
  }

  /**
   * Get or create session ID from request
   * @param {Request} request - Express request object
   * @returns {string} - The session ID
   */
  getSessionId(request: Request): string {
    // Try to get from session
    const sessionId = (request as ExtendedRequest).session?.id;
    if (sessionId) {
      return sessionId;
    }

    // Fallback to IP + User Agent hash
    const ip = this.getClientIp(request);
    const userAgent = request.headers["user-agent"] || "unknown";
    const combined = `${ip}:${userAgent}`;

    return crypto.createHash("sha256").update(combined).digest("hex");
  }

  /**
   * Get client IP address
   * @param {Request} request - Express request object
   * @returns {string} - The client IP address
   */
  private getClientIp(request: Request): string {
    return (
      (request.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      (request.headers["x-real-ip"] as string) ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      "unknown"
    );
  }

  /**
   * Invalidate CSRF token
   * @param {string} sessionId - The session identifier
   */
  async invalidateToken(sessionId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await this.redisService.del(key);
  }

  /**
   * Clean up expired tokens
   * @returns {Promise<number>} - The number of tokens cleaned up
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const keys = await this.redisService.keys(`${this.SESSION_PREFIX}*`);
      let cleaned = 0;

      for (const key of keys) {
        const token = await this.redisService.get<CSRFToken>(key);
        if (token && Date.now() > token.expiresAt) {
          await this.redisService.del(key);
          cleaned++;
        }
      }

      return cleaned;
    } catch (error) {
      securityLogger.error("CSRF cleanup failed", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: "CSRFTokenService",
        operation: "cleanupExpiredTokens",
      });
      return 0;
    }
  }

  /**
   * Get CSRF token statistics
   * @returns {Promise<{ total: number; expired: number }>} - CSRF token statistics
   */
  async getTokenStats(): Promise<{total: number; expired: number}> {
    try {
      const keys = await this.redisService.keys(`${this.SESSION_PREFIX}*`);
      let expired = 0;

      for (const key of keys) {
        const token = await this.redisService.get<CSRFToken>(key);
        if (token && Date.now() > token.expiresAt) {
          expired++;
        }
      }

      return {
        total: keys.length,
        expired,
      };
    } catch (error) {
      securityLogger.error("Failed to get CSRF token stats", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: "CSRFTokenService",
        operation: "getTokenStats",
      });
      return {total: 0, expired: 0};
    }
  }
}
