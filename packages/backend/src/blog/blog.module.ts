import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { BlogService } from "./blog.service";
import { BlogController } from "./blog.controller";

@Module({
  imports: [PrismaModule],
  providers: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
