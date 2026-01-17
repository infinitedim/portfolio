import { z } from "zod";
import { router, publicProcedure } from "../init";

const getProjectsSchema = z
  .object({
    section: z.string().optional(),
    limit: z.number().int().positive().max(100).optional(),
    featured: z.boolean().optional(),
  })
  .optional();

export const projectsRouter = router({
  get: publicProcedure
    .input(getProjectsSchema)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const featured = input?.featured;

      const projects = await ctx.services.projects.getAll({
        limit,
        featured,
        status: "ACTIVE",
      });

      return projects;
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.services.projects.getBySlug(input.slug);
      return project;
    }),

  getFeatured: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.services.projects.getFeatured(input?.limit);
    }),
});

