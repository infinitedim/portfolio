import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { BlogService } from "./blog.service";
import { AuthGuard } from "../auth/auth.guard";

/**
 *
 * @param {string} slug - The slug to check
 * @returns {boolean} - Whether the slug is valid
 */
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

@Controller({ path: "blog", version: "1" })
export class BlogController {
  constructor(private blog: BlogService) {}

  @Get()
  async list(@Query("page") page = 1, @Query("pageSize") pageSize = 10) {
    return this.blog.list(Number(page), Number(pageSize));
  }

  @Get(":slug")
  async get(@Param("slug") slug: string) {
    if (!isValidSlug(slug)) return { error: "Invalid slug" } as const;
    return this.blog.findOne(slug);
  }

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body()
    dto: {
      title: string;
      slug: string;
      summary?: string;
      contentMd?: string;
      contentHtml?: string;
      published?: boolean;
    },
  ) {
    if (!isValidSlug(dto.slug)) return { error: "Invalid slug" } as const;
    return this.blog.create(dto);
  }

  @UseGuards(AuthGuard)
  @Patch(":slug")
  async update(
    @Param("slug") slug: string,
    @Body()
    dto: Partial<{
      title: string;
      summary?: string;
      contentMd?: string;
      contentHtml?: string;
      published?: boolean;
    }>,
  ) {
    if (!isValidSlug(slug)) return { error: "Invalid slug" } as const;
    return this.blog.update(slug, dto);
  }

  @UseGuards(AuthGuard)
  @Delete(":slug")
  async remove(@Param("slug") slug: string) {
    if (!isValidSlug(slug)) return { error: "Invalid slug" } as const;
    return this.blog.delete(slug);
  }
}
