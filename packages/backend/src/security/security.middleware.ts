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
    // Log which services are available for debugging
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

    // Warn about missing critical services
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
   * Fallback method to get client IP when SecurityService is not available
   */
  private getFallbackClientIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0]?.trim() ?? "unknown";
    }
    return (
      req.connection?.remoteAddress ?? req.socket?.remoteAddress ?? "unknown"
    );
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
      // Skip security checks for excluded paths
      if (this.isExcludedPath(req.path)) {
        return next();
      }

      // Get client IP with fallback
      const clientIp =
        this.securityService?.getClientIp(req) ?? this.getFallbackClientIp(req);

      // Only perform rate limiting if SecurityService is available
      if (this.securityService) {
        const rateLimitType = this.securityService.getRateLimitType(req);
        const rateLimitResult = await this.securityService.checkRateLimit(
          clientIp,
          rateLimitType,
        );

        if (rateLimitResult.isBlocked) {
          // Log rate limit exceeded if audit service is available
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

        // Add comprehensive rate limit headers
        const rateLimitHeaders = this.securityService.getRateLimitHeaders(
          rateLimitResult.remaining,
          100, // Default limit
          rateLimitResult.resetTime,
        );

        // Set all rate limit headers
        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      } else {
        // Log warning about disabled rate limiting
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

      // Add additional security headers
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      res.setHeader(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()",
      );

      // Security checks for request body
      if (req.body && typeof req.body === "object") {
        await this.validateRequestBody(req);
      }

      // Security checks for query parameters
      if (req.query && Object.keys(req.query).length > 0) {
        await this.validateQueryParameters(req);
      }

      // Security checks for headers
      this.validateHeaders(req);

      // Generate CSRF token for state-changing requests (only if CSRF service is available)
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

      // Log security event for suspicious activity (only if audit service is available)
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

      // Log security event for middleware errors (only if audit service is available)
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

    // Paths that require CSRF protection for state-changing operations
    const csrfRequiredPaths = [
      "/auth/login",
      "/auth/register",
      "/admin",
      "/api/",      // All API routes
      "/trpc/",     // All tRPC routes (mutations)
    ];

    // Paths that are exempt from CSRF (typically read-only or have other auth)
    const csrfExemptPaths = [
      "/api/trpc",     // tRPC batch endpoint - uses JWT auth
      "/trpc/health",  // Health checks
      "/api/health",   // Health checks
    ];

    // Check if path is exempt
    const isExempt = csrfExemptPaths.some((path) => req.path.startsWith(path));
    if (isExempt) {
      return false;
    }

    // Check if request has valid JWT - JWT-authenticated requests don't need CSRF
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

    // Check for SQL injection patterns using SecurityService or fallback
    const hasSqlInjection =
      this.securityService?.hasSqlInjectionPatterns(bodyString) ??
      this.fallbackHasSqlInjectionPatterns(bodyString);

    if (hasSqlInjection) {
      // Log event if audit service is available
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

    // Check for XSS patterns using SecurityService or fallback
    const hasXss =
      this.securityService?.hasXssPatterns(bodyString) ??
      this.fallbackHasXssPatterns(bodyString);

    if (hasXss) {
      // Log event if audit service is available
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

    // Check for SQL injection patterns in query parameters
    const hasSqlInjection =
      this.securityService?.hasSqlInjectionPatterns(queryString) ??
      this.fallbackHasSqlInjectionPatterns(queryString);

    if (hasSqlInjection) {
      // Log event if audit service is available
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

    // Check for path traversal attempts
    const pathTraversalPatterns = [/\.\.\//, /\.\.\\/];
    const hasPathTraversal = pathTraversalPatterns.some((pattern) =>
      pattern.test(queryString),
    );

    if (hasPathTraversal) {
      // Log event if audit service is available
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
    // Check for suspicious headers
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

    // Validate content length for POST requests
    if (req.method === "POST") {
      const contentLength = parseInt(req.headers["content-length"] || "0");
      const maxContentLength = 10 * 1024 * 1024; // 10MB

      if (contentLength > maxContentLength) {
        throw new ForbiddenException("Request body too large");
      }
    }
  }

  private isSuspiciousRequest(req: Request): boolean {
    // Check for suspicious user agents
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

    // Check for suspicious paths
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
