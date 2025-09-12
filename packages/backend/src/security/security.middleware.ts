import { Injectable, ForbiddenException } from "@nestjs/common";
import type { NestMiddleware } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";
import { SecurityService } from "./security.service";
import { AuditLogService, AuditEventType } from "./audit-log.service";
import { CSRFTokenService } from "./csrf.service";

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
    private readonly securityService: SecurityService,
    private readonly auditLogService: AuditLogService,
    private readonly csrfService: CSRFTokenService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Skip security checks for excluded paths
      if (this.isExcludedPath(req.path)) {
        return next();
      }

      const clientIp = this.securityService.getClientIp(req);
      const rateLimitType = this.securityService.getRateLimitType(req);

      // Check rate limiting
      const rateLimitResult = await this.securityService.checkRateLimit(
        clientIp,
        rateLimitType,
      );

      if (rateLimitResult.isBlocked) {
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

      // Add additional security headers
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("X-XSS-Protection", "1; mode=block");
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

      // Generate CSRF token for state-changing requests
      if (this.requiresCSRFToken(req)) {
        const sessionId = this.csrfService.getSessionId(req);
        const csrfToken = await this.csrfService.generateToken(sessionId);
        this.csrfService.setTokenCookie(res, csrfToken.token, req.secure);
      }

      // Log security event for suspicious activity
      if (this.isSuspiciousRequest(req)) {
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

      console.error("Security middleware error:", error);

      // Log security event for middleware errors
      await this.auditLogService.logSecurityEvent(
        AuditEventType.SYSTEM_ERROR,
        {
          error: error instanceof Error ? error.message : "Unknown error",
          path: req.path,
          method: req.method,
        },
        req,
      );

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
    const csrfRequiredPaths = ["/auth/login", "/auth/register", "/admin"];

    return (
      stateChangingMethods.includes(req.method) &&
      csrfRequiredPaths.some((path) => req.path.startsWith(path))
    );
  }

  private async validateRequestBody(req: Request): Promise<void> {
    const bodyString = JSON.stringify(req.body);

    // Check for SQL injection patterns
    if (this.securityService.hasSqlInjectionPatterns(bodyString)) {
      await this.auditLogService.logSecurityEvent(
        AuditEventType.SQL_INJECTION_ATTEMPT,
        {
          ip: this.securityService.getClientIp(req),
          path: req.path,
          method: req.method,
          body: this.securityService.sanitizeForLogging(req.body),
        },
        req,
      );
      throw new ForbiddenException("SQL injection attempt detected");
    }

    // Check for XSS patterns
    if (this.securityService.hasXssPatterns(bodyString)) {
      await this.auditLogService.logSecurityEvent(
        AuditEventType.XSS_ATTEMPT,
        {
          ip: this.securityService.getClientIp(req),
          path: req.path,
          method: req.method,
          body: this.securityService.sanitizeForLogging(req.body),
        },
        req,
      );
      throw new ForbiddenException("XSS attempt detected");
    }
  }

  private async validateQueryParameters(req: Request): Promise<void> {
    const queryString = JSON.stringify(req.query);

    // Check for SQL injection patterns in query parameters
    if (this.securityService.hasSqlInjectionPatterns(queryString)) {
      await this.auditLogService.logSecurityEvent(
        AuditEventType.SQL_INJECTION_ATTEMPT,
        {
          ip: this.securityService.getClientIp(req),
          path: req.path,
          method: req.method,
          query: this.securityService.sanitizeForLogging(req.query),
        },
        req,
      );
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
      await this.auditLogService.logSecurityEvent(
        AuditEventType.SUSPICIOUS_ACTIVITY,
        {
          ip: this.securityService.getClientIp(req),
          path: req.path,
          method: req.method,
          query: this.securityService.sanitizeForLogging(req.query),
          reason: "Path traversal attempt detected",
        },
        req,
      );
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
        console.warn(`Suspicious header detected: ${header}`, {
          ip: this.securityService.getClientIp(req),
          path: req.path,
          method: req.method,
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
