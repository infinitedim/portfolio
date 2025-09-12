import { Module } from "@nestjs/common";
import { SecurityService } from "./security.service";
import { SecurityMiddleware } from "./security.middleware";
import { CSRFTokenService } from "./csrf.service";
import { CSRFMiddleware } from "./csrf.middleware";
import { AuditLogService } from "./audit-log.service";
import { PrismaModule } from "../prisma/prisma.module";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    SecurityService,
    SecurityMiddleware,
    CSRFTokenService,
    CSRFMiddleware,
    AuditLogService,
  ],
  exports: [
    SecurityService,
    SecurityMiddleware,
    CSRFTokenService,
    CSRFMiddleware,
    AuditLogService,
  ],
})
export class SecurityModule {}
