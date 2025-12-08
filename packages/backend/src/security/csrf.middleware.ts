import { Injectable, ForbiddenException } from "@nestjs/common";
import type { NestMiddleware } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";
import { CSRFTokenService } from "./csrf.service";
import { securityLogger } from "../logging/logger";

@Injectable()
export class CSRFMiddleware implements NestMiddleware {
  private readonly SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
  private readonly EXCLUDED_PATHS = [
    "/health",
    "/healthz",
    "/ping",
    "/api/health",
    "/trpc/health",
  ];

  constructor(private readonly csrfService: CSRFTokenService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Skip CSRF validation for safe methods
    if (this.SAFE_METHODS.includes(req.method)) {
      return next();
    }

    // Skip CSRF validation for excluded paths
    if (this.isExcludedPath(req.path)) {
      return next();
    }

    // Skip CSRF validation for API routes that use JWT authentication
    if (this.isAPIRoute(req.path) && this.hasValidJWT(req)) {
      return next();
    }

    // Validate CSRF token for state-changing requests
    await this.validateCSRFToken(req, res, next);
  }

  private isExcludedPath(path: string): boolean {
    return this.EXCLUDED_PATHS.some((excludedPath) =>
      path.startsWith(excludedPath),
    );
  }

  private isAPIRoute(path: string): boolean {
    return path.startsWith("/api/") || path.startsWith("/trpc/");
  }

  private hasValidJWT(req: Request): boolean {
    const authHeader = req.headers.authorization;
    return Boolean(authHeader && authHeader.startsWith("Bearer "));
  }

  private async validateCSRFToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const sessionId = this.csrfService.getSessionId(req);
      const token = this.csrfService.extractTokenFromRequest(req);

      if (!token) {
        throw new ForbiddenException("CSRF token is required");
      }

      const validationResult = await this.csrfService.validateToken(
        sessionId,
        token,
      );

      if (!validationResult.isValid) {
        throw new ForbiddenException(
          `CSRF validation failed: ${validationResult.error}`,
        );
      }

      // Token is valid, proceed
      next();
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      securityLogger.error("CSRF middleware error", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: "CSRFMiddleware",
        operation: "use",
      });
      throw new ForbiddenException("CSRF validation failed");
    }
  }
}
