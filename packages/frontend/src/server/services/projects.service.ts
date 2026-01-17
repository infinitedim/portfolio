import { prisma } from "../db";
import { redisService } from "../redis";
import type { Project, ProjectStatus } from "../../../node_modules/.prisma/client";

const CACHE_PREFIX = "projects:";
const CACHE_TTL = 600; // 10 minutes

/**
 * Get all projects
 */
export async function getAll(options?: {
  status?: ProjectStatus;
  featured?: boolean;
  limit?: number;
}): Promise<Project[]> {
  const cacheKey = `${CACHE_PREFIX}list:${JSON.stringify(options)}`;

  const cached = await redisService.get<Project[]>(cacheKey);
  if (cached) return cached;

  const projects = await prisma.project.findMany({
    where: {
      ...(options?.status && { status: options.status }),
      ...(options?.featured !== undefined && { featured: options.featured }),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: options?.limit,
  });

  await redisService.set(cacheKey, projects, CACHE_TTL);
  return projects;
}

/**
 * Get project by slug
 */
export async function getBySlug(slug: string): Promise<Project | null> {
  const cacheKey = `${CACHE_PREFIX}slug:${slug}`;

  const cached = await redisService.get<Project>(cacheKey);
  if (cached) return cached;

  const project = await prisma.project.findUnique({
    where: { slug },
  });

  if (project) {
    await redisService.set(cacheKey, project, CACHE_TTL);
  }

  return project;
}

/**
 * Get featured projects
 */
export async function getFeatured(limit: number = 6): Promise<Project[]> {
  return getAll({ featured: true, status: "ACTIVE", limit });
}

/**
 * Increment view count
 */
export async function incrementViews(id: string): Promise<void> {
  await prisma.project.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });
}

export const projectsService = {
  getAll,
  getBySlug,
  getFeatured,
  incrementViews,
};

export type ProjectsService = typeof projectsService;

