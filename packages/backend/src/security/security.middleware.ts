import { Injectable, ForbiddenException, Optional } from "@nestjs/common";
import type { NestMiddleware } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";
import { SecurityService } from "./security.service";
import { AuditLogService, AuditEventType } from "./audit-log.service";
import { CSRFTokenService } from "./csrf.service";
import { securityLogger } from "../logging/logger";

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly EXCLUDED_PATHS = [
    "/health",
    "/healthz",
    "/ping",
    "/api/health",
    "/trpc/health",
    "/favicon.ico",
    "/robots.txt",
  ];

  constructor(
    @Optional() private readonly securityService?: SecurityService,
    @Optional() private readonly auditLogService?: AuditLogService,
    @Optional() private readonly csrfService?: CSRFTokenService,
  ) {
    this.logServiceAvailability();
  }

  private logServiceAvailability(): void {
    const availableServices = {
      securityService: !!this.securityService,
      auditLogService: !!this.auditLogService,
      csrfService: !!this.csrfService,
    };

    securityLogger.info("Security middleware service availability", {
      ...availableServices,
      component: "SecurityMiddleware",
      operation: "constructor",
    });

    if (!this.securityService) {
      securityLogger.warn(
        "SecurityService not available - rate limiting disabled",
        {
          component: "SecurityMiddleware",
          operation: "constructor",
        },
      );
    }

    if (!this.auditLogService) {
      securityLogger.warn(
        "AuditLogService not available - security event logging disabled",
        {
          component: "SecurityMiddleware",
          operation: "constructor",
        },
      );
    }

    if (!this.csrfService) {
      securityLogger.warn(
        "CSRFTokenService not available - CSRF protection disabled",
        {
          component: "SecurityMiddleware",
          operation: "constructor",
        },
      );
    }
  }

  /**
   * Get configured trusted proxies from environment.
   * These are IP addresses of reverse proxies that we trust to provide X-Forwarded-For.
   */
  private getTrustedProxies(): string[] {
    const proxies = process.env.TRUSTED_PROXIES || "";
    return proxies
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }

  /**
   * Check if the request came from a trusted proxy.
   * Only trust X-Forwarded-For when the immediate connection is from a known proxy.
   */
  private isFromTrustedProxy(req: Request): boolean {
    const trustedProxies = this.getTrustedProxies();
    if (trustedProxies.length === 0) {
      return false;
    }

    const socketIp =
      req.socket?.remoteAddress || req.connection?.remoteAddress || "";

    const normalizedSocketIp = socketIp.replace(/^::ffff:/, "");

    return trustedProxies.some((proxy) => {
      const normalizedProxy = proxy.replace(/^::ffff:/, "");
      return normalizedSocketIp === normalizedProxy;
    });
  }

  /**
   * Secure method to get client IP with proper proxy validation.
   * Only trusts X-Forwarded-For when request comes from a configured trusted proxy.
   */
  private getSecureClientIp(req: Request): string {
    const socketIp =
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      req.ip ||
      "unknown";

    const normalizedSocketIp = socketIp.replace(/^::ffff:/, "");

    if (this.isFromTrustedProxy(req)) {
      const forwarded = req.headers["x-forwarded-for"];
      if (typeof forwarded === "string") {
        const clientIp = forwarded.split(",")[0]?.trim();
        if (clientIp) {
          securityLogger.debug("Using X-Forwarded-For from trusted proxy", {
            clientIp,
            socketIp: normalizedSocketIp,
            component: "SecurityMiddleware",
            operation: "getSecureClientIp",
          });
          return clientIp.replace(/^::ffff:/, "");
        }
      }
    } else if (req.headers["x-forwarded-for"]) {
      securityLogger.warn(
        "X-Forwarded-For header ignored - not from trusted proxy",
        {
          socketIp: normalizedSocketIp,
          component: "SecurityMiddleware",
          operation: "getSecureClientIp",
        },
      );
    }

    return normalizedSocketIp;
  }

  /**
   * Fallback method to get client IP when SecurityService is not available.
   * Uses secure client IP extraction with proxy validation.
   */
  private getFallbackClientIp(req: Request): string {
    return this.getSecureClientIp(req);
  }

  /**
   * Fallback method to sanitize data for logging when SecurityService is not available
   */
  private fallbackSanitizeForLogging(obj: unknown): Record<string, unknown> {
    if (!obj || typeof obj !== "object") {
      return {};
    }

    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = [
      "password",
      "token",
      "apiKey",
      "secret",
      "auth",
      "authorization",
    ];

    for (const [key, value] of Object.entries(obj)) {
      if (
        sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
      ) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "string" && value.length > 100) {
        sanitized[key] = value.substring(0, 100) + "...";
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Fallback method to detect basic SQL injection patterns
   */
  private fallbackHasSqlInjectionPatterns(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /'[^']*'[^']*'/i,
      /--.*$/m,
      /\/\*.*\*\//i,
    ];

    return sqlPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Fallback method to detect basic XSS patterns
   */
  private fallbackHasXssPatterns(input: string): boolean {
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[\s\S]*?>/i,
      /<object[\s\S]*?>/i,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (this.isExcludedPath(req.path)) {
        return next();
      }

      const clientIp =
        this.securityService?.getClientIp(req) ?? this.getFallbackClientIp(req);

      if (this.securityService) {
        const rateLimitType = this.securityService.getRateLimitType(req);
        const rateLimitResult = await this.securityService.checkRateLimit(
          clientIp,
          rateLimitType,
        );

        if (rateLimitResult.isBlocked) {
          if (this.auditLogService) {
            await this.auditLogService.logSecurityEvent(
              AuditEventType.RATE_LIMIT_EXCEEDED,
              {
                ip: clientIp,
                path: req.path,
                method: req.method,
                retryAfter: rateLimitResult.retryAfter,
              },
              req,
            );
          }

          throw new ForbiddenException(rateLimitResult.message);
        }

        const rateLimitHeaders = this.securityService.getRateLimitHeaders(
          rateLimitResult.remaining,
          100, // Default limit
          rateLimitResult.resetTime,
        );

        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      } else {
        securityLogger.warn(
          "Rate limiting disabled due to missing SecurityService",
          {
            ip: clientIp,
            path: req.path,
            method: req.method,
            component: "SecurityMiddleware",
            operation: "use",
          },
        );
      }

      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      res.setHeader(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()",
      );

      if (req.body && typeof req.body === "object") {
        await this.validateRequestBody(req);
      }

      if (req.query && Object.keys(req.query).length > 0) {
        await this.validateQueryParameters(req);
      }

      this.validateHeaders(req);

      if (this.requiresCSRFToken(req) && this.csrfService) {
        try {
          const sessionId = this.csrfService.getSessionId(req);
          const csrfToken = await this.csrfService.generateToken(sessionId);
          this.csrfService.setTokenCookie(res, csrfToken.token, req.secure);
        } catch (error) {
          securityLogger.warn("CSRF token generation failed", {
            error: error instanceof Error ? error.message : String(error),
            path: req.path,
            component: "SecurityMiddleware",
            operation: "use",
          });
        }
      } else if (this.requiresCSRFToken(req)) {
        securityLogger.warn(
          "CSRF protection disabled due to missing CSRFTokenService",
          {
            path: req.path,
            method: req.method,
            component: "SecurityMiddleware",
            operation: "use",
          },
        );
      }

      if (this.isSuspiciousRequest(req) && this.auditLogService) {
        await this.auditLogService.logSecurityEvent(
          AuditEventType.SUSPICIOUS_ACTIVITY,
          {
            ip: clientIp,
            path: req.path,
            method: req.method,
            userAgent: req.headers["user-agent"],
            reason: "Suspicious request pattern detected",
          },
          req,
        );
      }

      next();
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      securityLogger.error("Security middleware error", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        path: req.path,
        method: req.method,
        component: "SecurityMiddleware",
        operation: "use",
      });

      if (this.auditLogService) {
        await this.auditLogService.logSecurityEvent(
          AuditEventType.SYSTEM_ERROR,
          {
            error: error instanceof Error ? error.message : "Unknown error",
            path: req.path,
            method: req.method,
          },
          req,
        );
      }

      throw new ForbiddenException("Security check failed");
    }
  }

  private isExcludedPath(path: string): boolean {
    return this.EXCLUDED_PATHS.some((excludedPath) =>
      path.startsWith(excludedPath),
    );
  }

  private requiresCSRFToken(req: Request): boolean {
    const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];

    const csrfRequiredPaths = [
      "/auth/login",
      "/auth/register",
      "/admin",
      "/api/",
      "/trpc/",
    ];

    // Paths that are exempt from CSRF (typically read-only or have other auth)
    const csrfExemptPaths = [
      "/api/trpc", // tRPC batch endpoint - uses JWT auth
      "/trpc/health", // Health checks
      "/api/health", // Health checks
    ];

    const isExempt = csrfExemptPaths.some((path) => req.path.startsWith(path));
    if (isExempt) {
      return false;
    }

    const hasJWT = req.headers.authorization?.startsWith("Bearer ");
    if (hasJWT) {
      return false;
    }

    return (
      stateChangingMethods.includes(req.method) &&
      csrfRequiredPaths.some((path) => req.path.startsWith(path))
    );
  }

  private async validateRequestBody(req: Request): Promise<void> {
    const bodyString = JSON.stringify(req.body);
    const clientIp =
      this.securityService?.getClientIp(req) ?? this.getFallbackClientIp(req);

    const hasSqlInjection =
      this.securityService?.hasSqlInjectionPatterns(bodyString) ??
      this.fallbackHasSqlInjectionPatterns(bodyString);

    if (hasSqlInjection) {
      if (this.auditLogService) {
        const sanitizedBody =
          this.securityService?.sanitizeForLogging(req.body) ??
          this.fallbackSanitizeForLogging(req.body);

        await this.auditLogService.logSecurityEvent(
          AuditEventType.SQL_INJECTION_ATTEMPT,
          {
            ip: clientIp,
            path: req.path,
            method: req.method,
            body: sanitizedBody,
          },
          req,
        );
      }
      throw new ForbiddenException("SQL injection attempt detected");
    }

    const hasXss =
      this.securityService?.hasXssPatterns(bodyString) ??
      this.fallbackHasXssPatterns(bodyString);

    if (hasXss) {
      if (this.auditLogService) {
        const sanitizedBody =
          this.securityService?.sanitizeForLogging(req.body) ??
          this.fallbackSanitizeForLogging(req.body);

        await this.auditLogService.logSecurityEvent(
          AuditEventType.XSS_ATTEMPT,
          {
            ip: clientIp,
            path: req.path,
            method: req.method,
            body: sanitizedBody,
          },
          req,
        );
      }
      throw new ForbiddenException("XSS attempt detected");
    }
  }

  private async validateQueryParameters(req: Request): Promise<void> {
    const queryString = JSON.stringify(req.query);
    const clientIp =
      this.securityService?.getClientIp(req) ?? this.getFallbackClientIp(req);

    const hasSqlInjection =
      this.securityService?.hasSqlInjectionPatterns(queryString) ??
      this.fallbackHasSqlInjectionPatterns(queryString);

    if (hasSqlInjection) {
      if (this.auditLogService) {
        const sanitizedQuery =
          this.securityService?.sanitizeForLogging(req.query) ??
          this.fallbackSanitizeForLogging(req.query);

        await this.auditLogService.logSecurityEvent(
          AuditEventType.SQL_INJECTION_ATTEMPT,
          {
            ip: clientIp,
            path: req.path,
            method: req.method,
            query: sanitizedQuery,
          },
          req,
        );
      }
      throw new ForbiddenException(
        "SQL injection attempt detected in query parameters",
      );
    }

    const pathTraversalPatterns = [/\.\.\//, /\.\.\\/];
    const hasPathTraversal = pathTraversalPatterns.some((pattern) =>
      pattern.test(queryString),
    );

    if (hasPathTraversal) {
      if (this.auditLogService) {
        const sanitizedQuery =
          this.securityService?.sanitizeForLogging(req.query) ??
          this.fallbackSanitizeForLogging(req.query);

        await this.auditLogService.logSecurityEvent(
          AuditEventType.SUSPICIOUS_ACTIVITY,
          {
            ip: clientIp,
            path: req.path,
            method: req.method,
            query: sanitizedQuery,
            reason: "Path traversal attempt detected",
          },
          req,
        );
      }
      throw new ForbiddenException("Path traversal attempt detected");
    }
  }

  private validateHeaders(req: Request): void {
    const suspiciousHeaders = [
      "x-forwarded-host",
      "x-forwarded-proto",
      "x-forwarded-port",
    ];

    for (const header of suspiciousHeaders) {
      if (req.headers[header]) {
        const clientIp =
          this.securityService?.getClientIp(req) ??
          this.getFallbackClientIp(req);

        securityLogger.warn(`Suspicious header detected: ${header}`, {
          header,
          ip: clientIp,
          path: req.path,
          method: req.method,
          component: "SecurityMiddleware",
          operation: "validateHeaders",
        });
      }
    }

    if (req.method === "POST") {
      const contentLength = parseInt(req.headers["content-length"] || "0");
      const maxContentLength = 10 * 1024 * 1024;

      if (contentLength > maxContentLength) {
        throw new ForbiddenException("Request body too large");
      }
    }
  }

  private isSuspiciousRequest(req: Request): boolean {
    const userAgent = req.headers["user-agent"] || "";
    const suspiciousUserAgents = [
      "sqlmap",
      "nikto",
      "nmap",
      "scanner",
      "bot",
      "crawler",
      "spider",
    ];

    const hasSuspiciousUserAgent = suspiciousUserAgents.some((agent) =>
      userAgent.toLowerCase().includes(agent.toLowerCase()),
    );

    const suspiciousPaths = [
      "/admin",
      "/wp-admin",
      "/phpmyadmin",
      "/config",
      "/.env",
      "/.git",
    ];

    const hasSuspiciousPath = suspiciousPaths.some((path) =>
      req.path.toLowerCase().includes(path.toLowerCase()),
    );

    return hasSuspiciousUserAgent || hasSuspiciousPath;
  }
}
