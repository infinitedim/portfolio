import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthGuard } from "./auth.guard";
import { SecurityModule } from "../security/security.module";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [SecurityModule, RedisModule],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
