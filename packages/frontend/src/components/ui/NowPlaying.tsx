"use client";

import { useState, useEffect, useRef, JSX } from "react";
import { Music, Play, Pause, ExternalLink, Clock } from "lucide-react";

// Conditional tRPC import to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let trpc: any = null;
if (typeof window !== "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    trpc = require("@portfolio/frontend/src/lib/trpc").trpc;
  } catch (error) {
    console.warn("tRPC not available:", error);
  }
}

interface NowPlayingProps {
  onClose: () => void;
}

/**
 * NowPlaying component
 * @param {NowPlayingProps} props - The props for the NowPlaying component
 * @param {Function} props.onClose - The function to call when the NowPlaying component is closed
 * @returns {JSX.Element} The NowPlaying component
 */
export function NowPlaying({ onClose }: NowPlayingProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use tRPC query for now playing data (with fallback)
  const fallbackData = {
    data: null,
    refetch: () => Promise.resolve(),
    isLoading: false,
  };

  const {
    data: nowPlaying,
    refetch,
    isLoading: isFetching,
  } = trpc?.spotify?.nowPlaying?.useQuery?.(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
  }) || fallbackData;

  useEffect(() => {
    setIsLoading(isFetching);
    setError(null);

    // Set up progress updates every second
    progressIntervalRef.current = setInterval(() => {
      if (nowPlaying?.isPlaying && nowPlaying.progress && nowPlaying.duration) {
        const elapsed = nowPlaying.progress + (Date.now() - Date.now());
        const percentage = Math.min((elapsed / nowPlaying.duration) * 100, 100);
        setProgress(percentage);
      }
    }, 1000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [nowPlaying, isFetching]);

  const handleRefresh = () => {
    refetch();
  };

  const handleOpenSpotify = () => {
    if (nowPlaying?.songUrl) {
      window.open(nowPlaying.songUrl, "_blank");
    }
  };

  const formatProgress = () => {
    if (!nowPlaying?.progress || !nowPlaying?.duration) return "";

    const current = nowPlaying.progress + (Date.now() - Date.now());
    const total = nowPlaying.duration;

    const currentMinutes = Math.floor(current / 60000);
    const currentSeconds = Math.floor((current % 60000) / 1000);
    const totalMinutes = Math.floor(total / 60000);
    const totalSeconds = Math.floor((total % 60000) / 1000);

    return `${currentMinutes}:${currentSeconds.toString().padStart(2, "0")} / ${totalMinutes}:${totalSeconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-2xl p-6">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Loading...
            </h3>
            <p className="text-gray-400">Fetching your current track</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-2xl p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Error Loading Track
            </h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!nowPlaying || !nowPlaying.isPlaying) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-2xl p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>

          <div className="text-center">
            <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Nothing Playing
            </h3>
            <p className="text-gray-400 mb-6">
              Start playing a track on Spotify to see it here.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleRefresh}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        <div className="text-center">
          {/* Album Art */}
          <div className="relative mx-auto mb-4">
            {nowPlaying.albumArt ? (
              <img
                src={nowPlaying.albumArt}
                alt={`${nowPlaying.title} album art`}
                className="w-32 h-32 rounded-lg shadow-lg mx-auto"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
                <Music className="w-12 h-12 text-gray-500" />
              </div>
            )}

            {/* Play/Pause overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                {nowPlaying.isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-1" />
                )}
              </div>
            </div>
          </div>

          {/* Track Info */}
          <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
            {nowPlaying.title}
          </h3>
          <p className="text-gray-400 mb-4 line-clamp-1">{nowPlaying.artist}</p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{formatProgress()}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleOpenSpotify}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Spotify
            </button>
          </div>

          {/* Additional Info */}
          {nowPlaying.album && (
            <div className="mt-4 text-sm text-gray-400">
              <p>Album: {nowPlaying.album}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
