import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import sanitizeHtml from "sanitize-html";

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    title: string;
    slug: string;
    summary?: string;
    contentMd?: string;
    contentHtml?: string;
    published?: boolean;
  }) {
    const safeHtml = data.contentHtml
      ? sanitizeHtml(data.contentHtml)
      : undefined;
    return this.prisma.blogPost.create({
      data: { ...data, contentHtml: safeHtml },
    });
  }

  async update(
    slug: string,
    data: Partial<{
      title: string;
      summary?: string;
      contentMd?: string;
      contentHtml?: string;
      published?: boolean;
    }>,
  ) {
    const post = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (!post) throw new NotFoundException("Post not found");
    const safeHtml = data.contentHtml
      ? sanitizeHtml(data.contentHtml)
      : undefined;
    return this.prisma.blogPost.update({
      where: { slug },
      data: { ...data, contentHtml: safeHtml },
    });
  }

  async findOne(slug: string) {
    return this.prisma.blogPost.findUnique({ where: { slug } });
  }

  async list(page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.blogPost.count(),
    ]);
    return { items, page, pageSize, total };
  }

  async delete(slug: string) {
    return this.prisma.blogPost.delete({ where: { slug } });
  }
}
