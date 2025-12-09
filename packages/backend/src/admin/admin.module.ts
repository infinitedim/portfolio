import { Module } from "@nestjs/common";
import { AdminProfileService } from "./admin-profile.service";
import { AdminProfileController } from "./admin-profile.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { SecurityModule } from "../security/security.module";

@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [AdminProfileController],
  providers: [AdminProfileService],
  exports: [AdminProfileService],
})
export class AdminModule {}
