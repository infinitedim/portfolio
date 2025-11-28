/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { SecurityService } from "../security/security.service";
import { AuditLogService, AuditEventType } from "../security/audit-log.service";
import { RedisService } from "../redis/redis.service";
import { env } from "../env.config";
import { securityLogger } from "../logging/logger";

export type AuthUser = { userId: string; email: string; role: "admin" };

// Token blacklist prefix for Redis
const TOKEN_BLACKLIST_PREFIX = "token:blacklist:";
// Default blacklist TTL matches JWT expiry (15 minutes) + buffer
const TOKEN_BLACKLIST_TTL = 20 * 60; // 20 minutes in seconds

@Injectable()
export class AuthService {
  private readonly adminEmail: string;
  private readonly adminPasswordHash?: string;

  constructor(
    private readonly securityService: SecurityService,
    private readonly auditLogService: AuditLogService,
    private readonly redisService: RedisService,
  ) {
    this.adminEmail = env?.ADMIN_EMAIL || "";
    this.adminPasswordHash = env?.ADMIN_PASSWORD || "";

    if (!this.adminPasswordHash && env?.NODE_ENV === "production") {
      throw new Error("ADMIN_PASSWORD_HASH must be set in production");
    }
  }

  async validateCredentials(
    email: string,
    password: string,
    clientIp: string,
    request?: any,
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    // Validate input
    const validatedEmail = this.securityService.validateEmail(email);
    this.securityService.validatePassword(password);

    // Security check
    this.securityService.securityCheck(email);
    this.securityService.securityCheck(password);

    // Check rate limit for login attempts
    const rateLimitResult = await this.securityService.checkRateLimit(
      clientIp,
      "login",
    );
    if (rateLimitResult.isBlocked) {
      await this.auditLogService.logAuthEvent(
        AuditEventType.LOGIN_FAILED,
        "unknown",
        false,
        request,
      );
      throw new UnauthorizedException(
        `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`,
      );
    }

    if (validatedEmail !== this.adminEmail) {
      await this.auditLogService.logAuthEvent(
        AuditEventType.LOGIN_FAILED,
        "unknown",
        false,
        request,
      );
      throw new UnauthorizedException("Invalid credentials");
    }

    // Always use secure password verification
    // In development without hash, we hash the password on-the-fly for comparison
    let isValidPassword = false;

    if (this.adminPasswordHash) {
      // Production: verify against stored hash
      isValidPassword = await this.securityService.verifyPassword(
        password,
        this.adminPasswordHash,
      );
    } else if (env?.NODE_ENV !== "production" && env?.ADMIN_PASSWORD) {
      // Development only: hash the dev password and compare securely
      // This prevents timing attacks while still allowing dev workflow
      const devPasswordHash = await this.securityService.hashPassword(
        env.ADMIN_PASSWORD,
      );
      isValidPassword = await this.securityService.verifyPassword(
        password,
        devPasswordHash,
      );
    } else {
      // No password configured
      await this.auditLogService.logAuthEvent(
        AuditEventType.LOGIN_FAILED,
        validatedEmail,
        false,
        request,
      );
      throw new UnauthorizedException("Admin not configured");
    }

    if (!isValidPassword) {
      await this.auditLogService.logAuthEvent(
        AuditEventType.LOGIN_FAILED,
        validatedEmail,
        false,
        request,
      );
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate tokens
    const user: AuthUser = {
      userId: "admin",
      email: validatedEmail,
      role: "admin",
    };

    const accessToken = this.securityService.generateAccessToken(user);
    const refreshToken = this.securityService.generateRefreshToken(user.userId);

    // Reset rate limit on successful login
    await this.securityService.resetRateLimit(clientIp, "login");

    // Log successful login
    await this.auditLogService.logAuthEvent(
      AuditEventType.LOGIN_SUCCESS,
      validatedEmail,
      true,
      request,
    );

    return { user, accessToken, refreshToken };
  }

  async refreshToken(
    refreshToken: string,
    clientIp: string,
    request?: any,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Validate refresh token
      const payload = this.securityService.verifyRefreshToken(refreshToken);

      // Check rate limit for refresh attempts
      const rateLimitResult = await this.securityService.checkRateLimit(
        clientIp,
        "api",
      );
      if (rateLimitResult.isBlocked) {
        throw new UnauthorizedException(
          `Too many refresh attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`,
        );
      }

      // Generate new tokens
      const user: AuthUser = {
        userId: payload.userId,
        email: this.adminEmail,
        role: "admin",
      };

      const newAccessToken = this.securityService.generateAccessToken(user);
      const newRefreshToken = this.securityService.generateRefreshToken(
        user.userId,
      );

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      await this.auditLogService.logSecurityEvent(
        AuditEventType.SUSPICIOUS_ACTIVITY,
        {
          action: "INVALID_REFRESH_TOKEN",
          clientIp,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        request,
      );
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  sign(user: AuthUser): string {
    return this.securityService.generateAccessToken(user);
  }

  verify(token: string): AuthUser | null {
    try {
      const payload = this.securityService.verifyAccessToken(token);
      return {
        userId: payload.userId,
        email: payload.email || "",
        role: payload.role,
      };
    } catch {
      return null;
    }
  }

  async logout(token: string, clientIp: string, request?: any): Promise<void> {
    try {
      // Extract JWT ID for blacklisting
      const jti = this.securityService.extractJWTId(token);
      if (jti) {
        // Blacklist the token to prevent reuse after logout
        await this.blacklistToken(jti);
        securityLogger.info("Token blacklisted on logout", {
          jti,
          clientIp,
          component: "AuthService",
          operation: "logout",
        });
      }

      // Reset rate limit for the client
      await this.securityService.resetRateLimit(clientIp, "api");

      // Log logout event
      await this.auditLogService.logAuthEvent(
        AuditEventType.LOGOUT,
        "admin",
        true,
        request,
      );
    } catch (error) {
      // Log error but don't throw - logout should always succeed
      securityLogger.error("Error during logout", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: "AuthService",
        operation: "logout",
      });
    }
  }

  /**
   * Blacklist a token by its JWT ID (jti)
   * @param {string} jti - The JWT ID to blacklist
   * @param {number} ttl - Time to live in seconds (default: TOKEN_BLACKLIST_TTL)
   */
  private async blacklistToken(
    jti: string,
    ttl: number = TOKEN_BLACKLIST_TTL,
  ): Promise<void> {
    try {
      const key = `${TOKEN_BLACKLIST_PREFIX}${jti}`;
      await this.redisService.set(key, { blacklistedAt: Date.now() }, ttl);
    } catch (error) {
      securityLogger.error("Failed to blacklist token", {
        error: error instanceof Error ? error.message : String(error),
        jti,
        component: "AuthService",
        operation: "blacklistToken",
      });
      // Don't throw - blacklisting failure shouldn't break logout
    }
  }

  /**
   * Check if a token is blacklisted
   * @param {string} jti - The JWT ID to check
   * @returns {Promise<boolean>} - True if token is blacklisted
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    try {
      const key = `${TOKEN_BLACKLIST_PREFIX}${jti}`;
      return await this.redisService.exists(key);
    } catch (error) {
      securityLogger.error("Failed to check token blacklist", {
        error: error instanceof Error ? error.message : String(error),
        jti,
        component: "AuthService",
        operation: "isTokenBlacklisted",
      });
      // Fail closed - if we can't check, assume it might be blacklisted
      return true;
    }
  }

  async validateToken(token: string, request?: any): Promise<AuthUser> {
    try {
      // First, check if token is blacklisted
      const jti = this.securityService.extractJWTId(token);
      if (jti) {
        const isBlacklisted = await this.isTokenBlacklisted(jti);
        if (isBlacklisted) {
          await this.auditLogService.logSecurityEvent(
            AuditEventType.SUSPICIOUS_ACTIVITY,
            {
              action: "BLACKLISTED_TOKEN_USED",
              jti,
            },
            request,
          );
          throw new UnauthorizedException("Token has been revoked");
        }
      }

      const payload = this.securityService.verifyAccessToken(token);
      return {
        userId: payload.userId,
        email: payload.email || "",
        role: payload.role,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      await this.auditLogService.logSecurityEvent(
        AuditEventType.SUSPICIOUS_ACTIVITY,
        {
          action: "INVALID_TOKEN",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        request,
      );
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
