import { Module, type MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { BlogModule } from "./blog/blog.module";
import { SpotifyModule } from "./spotify/spotify.module";
import { ProjectsModule } from "./projects/projects.module";
// import { LoggingModule } from "./logging/logging.module";
import { SecurityModule } from "./security/security.module";
import { SecurityMiddleware } from "./security/security.middleware";
import { CSRFMiddleware } from "./security/csrf.middleware";
import { CommonModule } from "./common/common.module";
import { APP_GUARD } from "@nestjs/core";
import { validateEnv } from "./env.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/.env`,
      load: [validateEnv],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    HealthModule,
    AuthModule,
    PrismaModule,
    RedisModule,
    BlogModule,
    SpotifyModule,
    ProjectsModule,
    // LoggingModule,
    SecurityModule,
    CommonModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware, CSRFMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
