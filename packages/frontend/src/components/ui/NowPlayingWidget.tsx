"use client";

import { JSX } from "react";
import useSWR from "swr";
import { Music, ExternalLink } from "lucide-react";

interface SpotifyData {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
  progress?: number;
  duration?: number;
  error?: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * NowPlayingWidget component using SWR for data fetching
 * @returns {JSX.Element} The NowPlayingWidget component
 */
export function NowPlayingWidget(): JSX.Element {
  const { data, error, isLoading } = useSWR<SpotifyData>(
    "/api/spotify/now-playing",
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Dedupe requests within 1 minute
    },
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center space-x-4 rounded-md border p-4 bg-gray-900/50">
        <div className="w-16 h-16 bg-gray-700 rounded animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-700 rounded animate-pulse" />
          <div className="h-3 bg-gray-700 rounded animate-pulse w-2/3" />
        </div>
        <Music className="w-5 h-5 text-green-400" />
      </div>
    );
  }

  // Error state
  if (error || data?.error) {
    return (
      <div className="flex items-center space-x-4 rounded-md border p-4 bg-red-900/20 border-red-500/20">
        <div className="w-16 h-16 bg-red-900/30 rounded flex items-center justify-center">
          <Music className="w-8 h-8 text-red-400" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-red-400">Spotify Unavailable</p>
          <p className="text-sm text-red-300">
            Unable to fetch now playing data
          </p>
        </div>
      </div>
    );
  }

  // Not playing state
  if (!data?.isPlaying) {
    return (
      <a
        href="https://open.spotify.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-4 rounded-md border p-4 transition-shadow hover:shadow-md bg-gray-900/50 hover:bg-gray-900/70"
      >
        <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center">
          <Music className="w-8 h-8 text-green-400" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-300">Not Listening</p>
          <p className="text-sm text-gray-400">Spotify</p>
        </div>
        <ExternalLink className="w-5 h-5 text-green-400" />
      </a>
    );
  }

  // Now playing state
  return (
    <a
      href={data.songUrl || "https://open.spotify.com"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center space-x-4 rounded-md border p-4 transition-shadow hover:shadow-md bg-gray-900/50 hover:bg-gray-900/70"
    >
      <div className="w-16 h-16 rounded overflow-hidden">
        {data.albumImageUrl ? (
          <img
            src={data.albumImageUrl}
            alt={data.album || "Album cover"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <Music className="w-8 h-8 text-green-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="font-medium text-gray-300 truncate"
          title={data.title}
        >
          {data.title || "Unknown Track"}
        </p>
        <p
          className="text-sm text-gray-400 truncate"
          title={data.artist}
        >
          {data.artist || "Unknown Artist"}
        </p>
        {data.progress && data.duration && (
          <div className="mt-1">
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div
                className="bg-green-400 h-1 rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min((data.progress / data.duration) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <ExternalLink className="w-5 h-5 text-green-400 flex-shrink-0" />
    </a>
  );
}
