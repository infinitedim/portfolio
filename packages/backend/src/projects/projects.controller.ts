import { Controller, Get, Param, Query } from "@nestjs/common";
import { ProjectsService } from "./projects.service";

/**
 *
 * @param {string} slug - The slug to check
 * @returns {boolean} - Whether the slug is valid
 */
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

@Controller({ path: "projects", version: "1" })
export class ProjectsController {
  constructor(private projects: ProjectsService) {}

  @Get()
  async list(@Query("page") page = 1, @Query("pageSize") pageSize = 12) {
    return this.projects.list(Number(page), Number(pageSize));
  }

  @Get(":slug")
  async get(@Param("slug") slug: string) {
    if (!isValidSlug(slug)) return { error: "Invalid slug" } as const;
    return this.projects.getBySlug(slug);
  }
}
