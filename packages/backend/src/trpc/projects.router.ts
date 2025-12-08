import { z } from "zod";
import { router, publicProcedure } from "./procedures";
import type { TrpcContext } from "./context";

const ProjectsUpdateSchema = z.object({
  section: z.enum(["skills", "projects", "experience", "about"]),
  data: z.record(z.string(), z.unknown()),
});

export const projectsRouter = router({
  get: publicProcedure
    .input(
      z
        .object({
          section: z.string().optional(),
          limit: z.number().optional(),
        })
        .optional(),
    )

    .query(({ ctx, input }) => {
      const typedCtx = ctx as TrpcContext;
      if (!typedCtx.user) throw new Error("Unauthorized");
      return { data: null, meta: null, input } as const;
    }),
  update: publicProcedure
    .input(ProjectsUpdateSchema)

    .mutation(({ ctx, input }) => {
      const typedCtx = ctx as TrpcContext;
      if (!typedCtx.user) throw new Error("Unauthorized");
      return {
        success: true,
        message: `${input.section} updated successfully`,
      } as const;
    }),
});
