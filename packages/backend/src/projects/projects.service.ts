import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async list(page = 1, pageSize = 12) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          tech: true,
          featured: true,
        },
      }),
      this.prisma.project.count(),
    ]);
    return { items, page, pageSize, total };
  }

  async getBySlug(slug: string) {
    return this.prisma.project.findUnique({ where: { slug } });
  }
}
