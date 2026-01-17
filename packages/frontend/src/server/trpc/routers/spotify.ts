import { router, publicProcedure } from "../init";

export const spotifyRouter = router({
  nowPlaying: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.spotify.nowPlaying();
  }),
});

