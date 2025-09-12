import { Module } from "@nestjs/common";
import { AdminProfileService } from "./admin-profile.service";
import { AllowedIpService } from "./allowed-ip.service";
import { AdminProfileController } from "./admin-profile.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { SecurityModule } from "../security/security.module";

@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [AdminProfileController],
  providers: [AdminProfileService, AllowedIpService],
  exports: [AdminProfileService, AllowedIpService],
})
export class AdminModule {}
