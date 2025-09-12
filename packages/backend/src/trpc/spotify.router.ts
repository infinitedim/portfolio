/* eslint-disable @typescript-eslint/no-explicit-any */
import { router, publicProcedure } from "@portfolio/trpc";
import { SpotifyServiceBackend } from "../spotify/spotify.service";
import { RedisService } from "../redis/redis.service";
import { TRPCError } from "@trpc/server";

export const spotifyRouter = router({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  nowPlaying: publicProcedure.query(async ({ ctx }) => {
    try {
      const redisService = new RedisService();
      const spotifyService = new SpotifyServiceBackend(
        {
          get: redisService.get.bind(redisService),
          set: redisService.set.bind(redisService),
        } as any,
        redisService,
      );

      const result = await spotifyService.nowPlaying();
      return result;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch Spotify data",
        cause: error,
      });
    }
  }),

  // Spotify OAuth callback handler
  authCallback: publicProcedure
    .input((input: unknown) => {
      if (typeof input === "object" && input !== null && "code" in input) {
        return { code: String(input.code) };
      }
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid input: code is required",
      });
    })
    .mutation(async ({ input }) => {
      try {
        const { code } = input;

        // Exchange code for tokens
        const tokenResponse = await fetch(
          "https://accounts.spotify.com/api/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(
                `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
              ).toString("base64")}`,
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code,
              redirect_uri: process.env.SPOTIFY_REDIRECT_URI || "",
            }),
          },
        );

        if (!tokenResponse.ok) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Failed to exchange authorization code for tokens",
          });
        }

        const tokenData = await tokenResponse.json();

        return {
          success: true,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Spotify authentication failed",
          cause: error,
        });
      }
    }),
});
