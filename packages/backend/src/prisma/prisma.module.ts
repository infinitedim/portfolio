import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { DatabaseConnectionManager } from "./database-connection-manager.service";

@Global()
@Module({
  providers: [PrismaService, DatabaseConnectionManager],
  exports: [PrismaService, DatabaseConnectionManager],
})
export class PrismaModule {}
