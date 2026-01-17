import jwt from "jsonwebtoken";
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
  type JWTPayload,
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
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) {
    authLogger.warn("Failed to parse time string, using default", {
      timeStr,
      default: "15m (900s)",
    });
    return 15 * 60;
  }

  const value = parseInt(match[1] ?? "0", 10);
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
    await auditLogService.logLoginFailure(email, clientIp, "Rate limit exceeded");
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
    // In development, hash the plain password for comparison
    passwordHash = await hashPassword(adminConfig.password);
  } else {
    // Try to get from database
    const dbUser = await prisma.adminUser.findUnique({
      where: { email },
      select: { passwordHash: true },
    });

    if (!dbUser) {
      await auditLogService.logLoginFailure(email, clientIp, "User not found");
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

  // Store token family in Redis
  const refreshPayload = verifyRefreshToken(refreshToken);
  const familyKey = `${TOKEN_FAMILY_PREFIX}${refreshPayload.familyId}`;
  await redisService.set(
    familyKey,
    {
      currentTokenId: refreshPayload.tokenId,
      userId: user.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    getTokenFamilyTTL(),
  );

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
    const { userId, tokenId, familyId, jti } = payload;

    // Check rate limit
    const rateLimit = await checkRateLimit(clientIp, "api");
    if (rateLimit.isBlocked) {
      throw new Error(rateLimit.message || "Too many refresh attempts");
    }

    // Check token family
    const familyKey = `${TOKEN_FAMILY_PREFIX}${familyId}`;
    const familyData = await redisService.get<{
      currentTokenId: string;
      userId: string;
      createdAt: number;
    }>(familyKey);

    if (familyData) {
      if (familyData.currentTokenId !== tokenId) {
        authLogger.warn("Refresh token reuse detected - possible replay attack", {
          familyId,
          presentedTokenId: tokenId,
          expectedTokenId: familyData.currentTokenId,
          userId,
          clientIp,
        });

        // Invalidate family
        await redisService.del(familyKey);
        if (jti) {
          await blacklistToken(jti);
        }

        await auditLogService.logSecurityEvent("REFRESH_TOKEN_REUSE", {
          familyId,
          tokenId,
          clientIp,
        });

        throw new Error("Token has already been used. Please login again.");
      }
    } else {
      // Family not found - token may have been invalidated
      authLogger.warn("Token family not found", { familyId, clientIp });
      throw new Error("Token has been revoked");
    }

    // Generate new tokens (same family)
    const user: AuthUser = {
      userId,
      email: getAdminConfig().email,
      role: "admin",
    };

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(userId, familyId);

    // Update family with new token
    const newPayload = verifyRefreshToken(newRefreshToken);
    await redisService.set(
      familyKey,
      {
        currentTokenId: newPayload.tokenId,
        userId,
        createdAt: familyData.createdAt,
        updatedAt: Date.now(),
      },
      getTokenFamilyTTL(),
    );

    // Blacklist old refresh token
    if (jti) {
      await blacklistToken(jti);
    }

    authLogger.debug("Tokens refreshed", { userId, familyId });

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

    // If refresh token provided, invalidate the family
    if (refreshToken) {
      try {
        const refreshPayload = verifyRefreshToken(refreshToken);
        const familyKey = `${TOKEN_FAMILY_PREFIX}${refreshPayload.familyId}`;
        await redisService.del(familyKey);

        if (refreshPayload.jti) {
          await blacklistToken(refreshPayload.jti, getTokenFamilyTTL());
        }
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
      await auditLogService.logSecurityEvent("BLACKLISTED_TOKEN_USED", {
        jti: payload.jti,
      });
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
export async function blacklistToken(
  jti: string,
  ttl: number = getTokenBlacklistTTL(),
): Promise<void> {
  const key = `${TOKEN_BLACKLIST_PREFIX}${jti}`;
  await redisService.set(key, { blacklistedAt: Date.now() }, ttl);
}

/**
 * Check if token is blacklisted
 */
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const key = `${TOKEN_BLACKLIST_PREFIX}${jti}`;
  return redisService.exists(key);
}

/**
 * Extract JWT ID from token
 */
export function extractJWTId(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded.jti || null;
  } catch {
    return null;
  }
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
  extractJWTId,
};

export type AuthService = typeof authService;

