/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { SecurityService } from "../security/security.service";
import { AuditLogService, AuditEventType } from "../security/audit-log.service";
import { env } from "../env.config";

export type AuthUser = { userId: string; email: string; role: "admin" };

@Injectable()
export class AuthService {
  private readonly adminEmail: string;
  private readonly adminPasswordHash?: string;

  constructor(
    private readonly securityService: SecurityService,
    private readonly auditLogService: AuditLogService,
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

    if (!this.adminPasswordHash) {
      // Development fallback: allow ADMIN_PASSWORD for local only
      if (env?.NODE_ENV !== "production") {
        const devPass = env?.ADMIN_PASSWORD || "admin";
        if (password !== devPass) {
          await this.auditLogService.logAuthEvent(
            AuditEventType.LOGIN_FAILED,
            validatedEmail,
            false,
            request,
          );
          throw new UnauthorizedException("Invalid credentials");
        }
      } else {
        await this.auditLogService.logAuthEvent(
          AuditEventType.LOGIN_FAILED,
          validatedEmail,
          false,
          request,
        );
        throw new UnauthorizedException("Admin not configured");
      }
    } else {
      const isValidPassword = await this.securityService.verifyPassword(
        password,
        this.adminPasswordHash,
      );
      if (!isValidPassword) {
        await this.auditLogService.logAuthEvent(
          AuditEventType.LOGIN_FAILED,
          validatedEmail,
          false,
          request,
        );
        throw new UnauthorizedException("Invalid credentials");
      }
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
      // Extract JWT ID for potential blacklisting
      const jti = this.securityService.extractJWTId(token);
      if (jti) {
        // In a production environment, you might want to blacklist the token
        // await this.blacklistToken(jti);
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
      console.error("Error during logout:", error);
    }
  }

  async validateToken(token: string, request?: any): Promise<AuthUser> {
    try {
      const payload = this.securityService.verifyAccessToken(token);
      return {
        userId: payload.userId,
        email: payload.email || "",
        role: payload.role,
      };
    } catch (error) {
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
