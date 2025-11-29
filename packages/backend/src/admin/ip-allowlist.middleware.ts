/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Injectable,
  type NestMiddleware,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";
import { AllowedIpService } from "./allowed-ip.service";
import { securityLogger } from "../logging/logger";

@Injectable()
export class IpAllowlistMiddleware implements NestMiddleware {
  constructor(private readonly allowedIpService: AllowedIpService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip IP check for non-admin routes
    if (!req.path.startsWith("/admin")) {
      return next();
    }

    // Skip IP check for login/auth routes - these have their own protection
    if (req.path.includes("/login") || req.path.includes("/auth")) {
      return next();
    }

    const clientIp = this.getClientIp(req);
    const adminUserId = (req as any).user?.id;

    // If accessing protected admin routes without authentication, reject
    if (!adminUserId) {
      securityLogger.warn("Unauthenticated access attempt to admin route", {
        path: req.path,
        ip: clientIp,
        method: req.method,
        component: "IpAllowlistMiddleware",
      });
      throw new UnauthorizedException(
        "Authentication required to access admin routes",
      );
    }

    // Check if IP is allowed for the authenticated user
    const isAllowed = await this.allowedIpService.isIpAllowed(
      adminUserId,
      clientIp,
    );

    if (!isAllowed) {
      throw new ForbiddenException(
        `Access denied from IP address: ${clientIp}. Please contact administrator to whitelist this IP.`,
      );
    }

    next();
  }

  private getClientIp(req: Request): string {
    // Check for forwarded headers (when behind proxy/load balancer)
    const forwardedFor = req.headers["x-forwarded-for"];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips?.split(",")[0]?.trim() ?? "unknown";
    }

    // Check for real IP header
    const realIp = req.headers["x-real-ip"];
    if (realIp) {
      return Array.isArray(realIp)
        ? (realIp[0] ?? "unknown")
        : (realIp ?? "unknown");
    }

    // Fallback to connection remote address
    return (
      req.connection.remoteAddress ?? req.socket.remoteAddress ?? "unknown"
    );
  }
}
