/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Injectable,
  type NestMiddleware,
  ForbiddenException,
} from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";
import { AllowedIpService } from "./allowed-ip.service";

@Injectable()
export class IpAllowlistMiddleware implements NestMiddleware {
  constructor(private readonly allowedIpService: AllowedIpService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip IP check for non-admin routes
    if (!req.path.startsWith("/admin")) {
      return next();
    }

    // Skip IP check for login routes
    if (req.path.includes("/login") || req.path.includes("/auth")) {
      return next();
    }

    const adminUserId = (req as any).user?.id;
    if (!adminUserId) {
      return next();
    }

    const clientIp = this.getClientIp(req);

    // Check if IP is allowed
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
