import { redisService } from "../redis";
import { getSpotifyConfig } from "../config";
import { apiLogger } from "../utils";

const CACHE_KEY = "spotify:now-playing";
const CACHE_TTL = 60; // 1 minute
const ERROR_CACHE_TTL = 30; // 30 seconds on error

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
    external_urls: { spotify: string };
    artists: Array<{ id: string; name: string }>;
    album: {
      id: string;
      name: string;
      images: Array<{ url: string; height: number; width: number }>;
    };
  };
  progress_ms?: number;
}

/**
 * Get Spotify access token using Client Credentials flow
 */
async function getAccessToken(): Promise<string> {
  const config = getSpotifyConfig();

  if (!config.clientId || !config.clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  const basic = Buffer.from(
    `${config.clientId}:${config.clientSecret}`,
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
    throw new Error(`Spotify token exchange failed: ${response.status}`);
  }

  const data = (await response.json()) as SpotifyAccessTokenResponse;
  return data.access_token;
}

/**
 * Get currently playing track
 */
export async function nowPlaying(): Promise<NowPlayingResponse> {
  // Check cache first
  const cached = await redisService.get<NowPlayingResponse>(CACHE_KEY);
  if (cached) return cached;

  try {
    const config = getSpotifyConfig();

    if (!config.clientId || !config.clientSecret) {
      return { isPlaying: false };
    }

    const accessToken = await getAccessToken();

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
      await redisService.set(CACHE_KEY, payload, CACHE_TTL);
      return payload;
    }

    if (response.status === 429) {
      apiLogger.warn("Spotify API rate limited");
      return { isPlaying: false };
    }

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const data = (await response.json()) as SpotifyCurrentlyPlayingResponse;

    if (data.currently_playing_type !== "track" || !data.item) {
      const payload: NowPlayingResponse = { isPlaying: false };
      await redisService.set(CACHE_KEY, payload, CACHE_TTL);
      return payload;
    }

    const payload: NowPlayingResponse = {
      isPlaying: data.is_playing,
      title: data.item.name,
      artist: data.item.artists.map((a) => a.name).join(", "),
      album: data.item.album.name,
      albumImageUrl: data.item.album.images[0]?.url,
      songUrl: data.item.external_urls.spotify,
      progress: data.progress_ms,
      duration: data.item.duration_ms,
    };

    await redisService.set(CACHE_KEY, payload, CACHE_TTL);
    return payload;
  } catch (error) {
    apiLogger.error("Spotify nowPlaying error", { error });

    const fallback: NowPlayingResponse = { isPlaying: false };
    await redisService.set(CACHE_KEY, fallback, ERROR_CACHE_TTL);
    return fallback;
  }
}

export const spotifyService = {
  nowPlaying,
};

export type SpotifyService = typeof spotifyService;

