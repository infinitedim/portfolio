import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = (req as Request).headers["authorization"];

    if (!header || typeof header !== "string") return false;
    const token = header.startsWith("Bearer ") ? header.slice(7) : header;

    try {
      // Use validateToken which checks both signature AND blacklist
      const user = await this.auth.validateToken(token, req);

      // Attach user onto request in a typed-safe manner
      (req as unknown as { user?: ReturnType<AuthService["verify"]> }).user =
        user ?? undefined;

      return Boolean(user);
    } catch {
      // Token is invalid, expired, or blacklisted
      return false;
    }
  }
}
