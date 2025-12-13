/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { SecurityService } from "../security/security.service";
import { AuditLogService, AuditEventType } from "../security/audit-log.service";
import { RedisService } from "../redis/redis.service";
import { env, getJWTConfig } from "../env.config";
import { securityLogger } from "../logging/logger";

export type AuthUser = { userId: string; email: string; role: "admin" };

const TOKEN_BLACKLIST_PREFIX = "token:blacklist:";
// Token family prefix for refresh token rotation tracking
const TOKEN_FAMILY_PREFIX = "token:family:";

/**
 * Parse a time string (e.g., "15m", "1h", "7d") to seconds
 * @param timeStr - Time string like "15m", "1h", "7d"
 * @returns Time in seconds
 */
function parseTimeToSeconds(timeStr: string): number {
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) {
    // Default to 15 minutes if parsing fails
    securityLogger.warn("Failed to parse time string, using default", {
      timeStr,
      default: "15m (900s)",
      component: "AuthService",
      operation: "parseTimeToSeconds",
    });
    return 15 * 60;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 24 * 60 * 60;
    default:
      return 15 * 60;
  }
}

// Calculate TOKEN_BLACKLIST_TTL dynamically based on JWT_EXPIRES_IN + 5 minute buffer
function getTokenBlacklistTTL(): number {
  const jwtConfig = getJWTConfig();
  const jwtExpirySeconds = parseTimeToSeconds(jwtConfig.expiresIn);
  // Add 5 minute buffer to ensure token is blacklisted longer than its validity
  return jwtExpirySeconds + 5 * 60;
}

// Refresh token family TTL matches refresh token expiry + 1 day buffer
function getTokenFamilyTTL(): number {
  const jwtConfig = getJWTConfig();
  const refreshExpirySeconds = parseTimeToSeconds(jwtConfig.refreshExpiresIn);
  // Add 1 day buffer
  return refreshExpirySeconds + 24 * 60 * 60;
}

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
    // In production, use ONLY the hashed password (plain text is forbidden)
    // In development, ADMIN_HASH_PASSWORD takes precedence if set
    this.adminPasswordHash = env?.ADMIN_HASH_PASSWORD || "";

    if (!this.adminPasswordHash && env?.NODE_ENV === "production") {
      throw new Error(
        "ADMIN_HASH_PASSWORD must be set in production. " +
          "Generate with: bun run --filter backend hash-password <password>",
      );
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
    // In production: ONLY hashed passwords are allowed (ADMIN_HASH_PASSWORD)
    // In development: ADMIN_HASH_PASSWORD takes precedence, fallback to ADMIN_PASSWORD
    let isValidPassword = false;

    if (this.adminPasswordHash) {
      // Verify against stored bcrypt hash (production and development with hash)
      isValidPassword = await this.securityService.verifyPassword(
        password,
        this.adminPasswordHash,
      );
    } else if (env?.NODE_ENV !== "production" && env?.ADMIN_PASSWORD) {
      // Development only: hash the dev password on-the-fly for comparison
      // This prevents timing attacks while still allowing dev workflow
      // WARNING: This path is for development convenience only
      securityLogger.warn(
        "Using plain text ADMIN_PASSWORD - not allowed in production",
        {
          component: "AuthService",
          operation: "validateCredentials",
        },
      );
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

    // Generate tokens with a new token family
    const user: AuthUser = {
      userId: "admin",
      email: validatedEmail,
      role: "admin",
    };

    const accessToken = this.securityService.generateAccessToken(user);
    // generateRefreshToken creates a new familyId when none is provided
    const refreshToken = this.securityService.generateRefreshToken(user.userId);

    // Initialize the token family in Redis for rotation tracking
    const refreshPayload =
      this.securityService.verifyRefreshToken(refreshToken);
    const familyKey = `${TOKEN_FAMILY_PREFIX}${refreshPayload.familyId}`;
    await this.redisService.set(
      familyKey,
      {
        currentTokenId: refreshPayload.tokenId,
        userId: user.userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      getTokenFamilyTTL(),
    );

    // Reset rate limit on successful login
    await this.securityService.resetRateLimit(clientIp, "login");

    // Log successful login
    await this.auditLogService.logAuthEvent(
      AuditEventType.LOGIN_SUCCESS,
      validatedEmail,
      true,
      request,
    );

    securityLogger.debug("New token family created on login", {
      familyId: refreshPayload.familyId,
      userId: user.userId,
      component: "AuthService",
      operation: "validateCredentials",
    });

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
      const { userId, tokenId, familyId, jti } = payload;

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

      // Token rotation: verify this token hasn't been used before
      const familyKey = `${TOKEN_FAMILY_PREFIX}${familyId}`;
      const familyData = await this.redisService.get<{
        currentTokenId: string;
        userId: string;
        createdAt: number;
      }>(familyKey);

      if (familyData) {
        // Family exists - check if this is the current valid token
        if (familyData.currentTokenId !== tokenId) {
          // Token reuse detected! This could be a replay attack.
          // Invalidate the entire family to force re-authentication
          securityLogger.warn(
            "Refresh token reuse detected - possible replay attack",
            {
              familyId,
              presentedTokenId: tokenId,
              expectedTokenId: familyData.currentTokenId,
              userId,
              clientIp,
              component: "AuthService",
              operation: "refreshToken",
            },
          );

          // Delete the family to invalidate all tokens in the chain
          await this.redisService.del(familyKey);

          // Blacklist the presented token's jti if available
          if (jti) {
            await this.blacklistToken(jti);
          }

          await this.auditLogService.logSecurityEvent(
            AuditEventType.SUSPICIOUS_ACTIVITY,
            {
              action: "REFRESH_TOKEN_REUSE",
              familyId,
              tokenId,
              clientIp,
            },
            request,
          );

          throw new UnauthorizedException(
            "Token has already been used. Please login again.",
          );
        }
      }

      // Generate new tokens (same family for rotation chain)
      const user: AuthUser = {
        userId,
        email: this.adminEmail,
        role: "admin",
      };

      const newAccessToken = this.securityService.generateAccessToken(user);
      const newRefreshToken = this.securityService.generateRefreshToken(
        user.userId,
        familyId, // Keep the same family for the rotation chain
      );

      // Extract the new token's ID for family tracking
      const newPayload =
        this.securityService.verifyRefreshToken(newRefreshToken);

      // Update family with new current token ID
      await this.redisService.set(
        familyKey,
        {
          currentTokenId: newPayload.tokenId,
          userId,
          createdAt: familyData?.createdAt ?? Date.now(),
          updatedAt: Date.now(),
        },
        getTokenFamilyTTL(),
      );

      // Blacklist the old token's jti to prevent reuse
      if (jti) {
        await this.blacklistToken(jti);
      }

      securityLogger.debug("Refresh token rotated successfully", {
        familyId,
        oldTokenId: tokenId,
        newTokenId: newPayload.tokenId,
        component: "AuthService",
        operation: "refreshToken",
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
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

  async logout(
    token: string,
    clientIp: string,
    request?: any,
    refreshToken?: string,
  ): Promise<void> {
    try {
      // Extract JWT ID for blacklisting access token
      const jti = this.securityService.extractJWTId(token);
      if (jti) {
        // Blacklist the access token to prevent reuse after logout
        await this.blacklistToken(jti);
        securityLogger.info("Access token blacklisted on logout", {
          jti,
          clientIp,
          component: "AuthService",
          operation: "logout",
        });
      }

      // If refresh token provided, invalidate its entire family
      if (refreshToken) {
        try {
          const refreshPayload =
            this.securityService.verifyRefreshToken(refreshToken);
          const familyKey = `${TOKEN_FAMILY_PREFIX}${refreshPayload.familyId}`;

          // Delete the family to invalidate all tokens in the chain
          await this.redisService.del(familyKey);

          // Also blacklist the refresh token's jti
          if (refreshPayload.jti) {
            await this.blacklistToken(refreshPayload.jti, getTokenFamilyTTL());
          }

          securityLogger.info("Token family invalidated on logout", {
            familyId: refreshPayload.familyId,
            clientIp,
            component: "AuthService",
            operation: "logout",
          });
        } catch (refreshError) {
          // Refresh token may already be expired/invalid - that's fine for logout
          securityLogger.debug("Could not invalidate refresh token on logout", {
            error:
              refreshError instanceof Error
                ? refreshError.message
                : String(refreshError),
            clientIp,
            component: "AuthService",
            operation: "logout",
          });
        }
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
   * @param {number} ttl - Time to live in seconds (default: computed from JWT_EXPIRES_IN + buffer)
   */
  private async blacklistToken(
    jti: string,
    ttl: number = getTokenBlacklistTTL(),
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
