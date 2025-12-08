/* eslint-disable @typescript-eslint/no-explicit-any */
import { router, publicProcedure } from "./procedures";
import { SpotifyServiceBackend } from "../spotify/spotify.service";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context";

export const spotifyRouter = router({
  nowPlaying: publicProcedure.query(async ({ ctx }) => {
    try {
      const typedCtx = ctx as TrpcContext;
      const spotifyService = new SpotifyServiceBackend(
        {
          get: typedCtx.services.redis.get.bind(typedCtx.services.redis),
          set: typedCtx.services.redis.set.bind(typedCtx.services.redis),
        } as any,
        typedCtx.services.redis,
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

        const tokenData = (await tokenResponse.json()) as {
          access_token: string;
          refresh_token: string;
          expires_in: number;
        };

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
