import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import * as cacheManager from "cache-manager";
import { RedisService } from "../redis/redis.service";

interface SpotifyAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyCurrentlyPlayingResponse {
  is_playing: boolean;
  currently_playing_type: string;
  item?: {
    id: string;
    name: string;
    duration_ms: number;
    external_urls: {
      spotify: string;
    };
    artists: Array<{
      id: string;
      name: string;
    }>;
    album: {
      id: string;
      name: string;
      images: Array<{
        url: string;
        height: number;
        width: number;
      }>;
    };
  };
  progress_ms?: number;
}

export interface NowPlayingResponse {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
  progress?: number;
  duration?: number;
}

@Injectable()
export class SpotifyServiceBackend {
  constructor(
    @Inject("CACHE_MANAGER") private cache: cacheManager.Cache,
    private readonly redis: RedisService,
  ) {}

  /**
   * Get access token using Client Credentials flow
   * @returns {string} The access token
   * Based on: https://developer.spotify.com/documentation/web-api/tutorials/code-flow
   */
  private async getAccessToken(): Promise<string> {
    const basic = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
    ).toString("base64");

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Spotify token exchange failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as SpotifyAccessTokenResponse;
    return data.access_token;
  }

  /**
   * Get currently playing track from Spotify
   * @returns {NowPlayingResponse} The currently playing track
   * Based on: https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track
   */
  async nowPlaying(): Promise<NowPlayingResponse> {
    const cacheKey = "spotify:now-playing";

    const cachedRedis = await this.redis.get<NowPlayingResponse>(cacheKey);
    if (cachedRedis) return cachedRedis;

    const cached = await this.cache.get<NowPlayingResponse>(cacheKey);
    if (cached) return cached;

    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        "https://api.spotify.com/v1/me/player/currently-playing",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 204) {
        const payload: NowPlayingResponse = { isPlaying: false };
        await this.cache.set(cacheKey, payload, 60_000); // 1 minute cache
        await this.redis.set(cacheKey, payload, 60); // 60 seconds cache
        return payload;
      }

      if (response.status === 429) {
        throw new ServiceUnavailableException("Spotify API rate limited");
      }

      if (!response.ok) {
        throw new ServiceUnavailableException(
          `Spotify API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as SpotifyCurrentlyPlayingResponse;

      if (data.currently_playing_type !== "track" || !data.item) {
        const payload: NowPlayingResponse = { isPlaying: false };
        await this.cache.set(cacheKey, payload, 60_000);
        await this.redis.set(cacheKey, payload, 60);
        return payload;
      }

      const payload: NowPlayingResponse = {
        isPlaying: data.is_playing,
        title: data.item.name,
        artist: data.item.artists.map((artist) => artist.name).join(", "),
        album: data.item.album.name,
        albumImageUrl: data.item.album.images[0]?.url,
        songUrl: data.item.external_urls.spotify,
        progress: data.progress_ms,
        duration: data.item.duration_ms,
      };

      await this.cache.set(cacheKey, payload, 60_000); // 1 minute cache
      await this.redis.set(cacheKey, payload, 60); // 60 seconds cache

      return payload;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      const fallbackPayload: NowPlayingResponse = { isPlaying: false };
      await this.cache.set(cacheKey, fallbackPayload, 30_000); // Shorter cache on error
      await this.redis.set(cacheKey, fallbackPayload, 30);
      return fallbackPayload;
    }
  }
}
