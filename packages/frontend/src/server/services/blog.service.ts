import { prisma } from "../db";
import { redisService } from "../redis";
import type { BlogPost } from "../../../node_modules/.prisma/client";

const CACHE_PREFIX = "blog:";
const CACHE_TTL = 300; // 5 minutes

export interface BlogPostCreateInput {
  title: string;
  slug: string;
  summary?: string;
  contentMd?: string;
  contentHtml?: string;
  published?: boolean;
  authorId?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
}

export interface BlogPostUpdateInput extends Partial<BlogPostCreateInput> {}

/**
 * Get all blog posts
 */
export async function getAll(options?: {
  published?: boolean;
  limit?: number;
  offset?: number;
}): Promise<BlogPost[]> {
  const cacheKey = `${CACHE_PREFIX}list:${JSON.stringify(options)}`;

  const cached = await redisService.get<BlogPost[]>(cacheKey);
  if (cached) return cached;

  const posts = await prisma.blogPost.findMany({
    where:
      options?.published !== undefined
        ? { published: options.published }
        : undefined,
    orderBy: { publishedAt: "desc" },
    take: options?.limit ?? 20,
    skip: options?.offset ?? 0,
  });

  await redisService.set(cacheKey, posts, CACHE_TTL);
  return posts;
}

/**
 * Get blog post by slug
 */
export async function getBySlug(slug: string): Promise<BlogPost | null> {
  const cacheKey = `${CACHE_PREFIX}slug:${slug}`;

  const cached = await redisService.get<BlogPost>(cacheKey);
  if (cached) return cached;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (post) {
    await redisService.set(cacheKey, post, CACHE_TTL);
  }

  return post;
}

/**
 * Create blog post
 */
export async function create(data: BlogPostCreateInput): Promise<BlogPost> {
  const post = await prisma.blogPost.create({
    data: {
      ...data,
      publishedAt: data.published ? new Date() : null,
    },
  });

  // Invalidate cache
  await invalidateCache();

  return post;
}

/**
 * Update blog post
 */
export async function update(
  id: string,
  data: BlogPostUpdateInput,
): Promise<BlogPost> {
  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...data,
      publishedAt: data.published ? new Date() : undefined,
    },
  });

  // Invalidate cache
  await invalidateCache();
  await redisService.del(`${CACHE_PREFIX}slug:${post.slug}`);

  return post;
}

/**
 * Delete blog post
 */
export async function remove(id: string): Promise<void> {
  const post = await prisma.blogPost.delete({
    where: { id },
  });

  await invalidateCache();
  await redisService.del(`${CACHE_PREFIX}slug:${post.slug}`);
}

/**
 * Invalidate list cache
 */
async function invalidateCache(): Promise<void> {
  const keys = await redisService.keys(`${CACHE_PREFIX}list:*`);
  for (const key of keys) {
    await redisService.del(key);
  }
}

export const blogService = {
  getAll,
  getBySlug,
  create,
  update,
  remove,
};

export type BlogService = typeof blogService;

