import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ServerlessConfig } from "../config/serverless.config";
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const config = ServerlessConfig.getConfig();
    // Prisma 7+ configuration - URL passed directly to constructor
    super(config.databaseUrl, {
      // Connection pooling for serverless
      log: config.logLevel === "debug" ? ["query", "error", "warn"] : ["error"],
    });
  }
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
  async enableShutdownHooks(app) {
    this.$on("beforeExit", async () => {
      await app.close();
    });
  }
}
