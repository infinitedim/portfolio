/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, JSX } from "react";
import { Music, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
import type { trpc as TrpcType } from "@/lib/trpc";

let trpc: typeof TrpcType | null = null;
if (typeof window !== "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    trpc = require("@/lib/trpc").trpc;
  } catch (error) {
    console.warn("tRPC not available:", error);
  }
}

/**
 * Props for the SpotifyAuth component
 * @interface SpotifyAuthProps
 * @property {() => void} onAuthenticated - Callback when authentication succeeds
 * @property {() => void} onClose - Callback to close the auth modal
 */
interface SpotifyAuthProps {
  onAuthenticated: () => void;
  onClose: () => void;
}

/**
 * Spotify authentication modal component
 * Handles OAuth flow for Spotify integration with loading and error states
 * @param {SpotifyAuthProps} props - Component props
 * @param {() => void} props.onAuthenticated - Success callback
 * @param {() => void} props.onClose - Close callback
 * @returns {JSX.Element} The Spotify authentication modal
 * @example
 * ```tsx
 * <SpotifyAuth
 *   onAuthenticated={handleAuth}
 *   onClose={handleClose}
 * />
 * ```
 */
export function SpotifyAuth({
  onAuthenticated,
  onClose,
}: SpotifyAuthProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const spotifyLoginMutation = trpc?.auth?.spotifyLogin?.useMutation?.() || {
    mutateAsync: async () => {
      throw new Error("tRPC not available - Spotify authentication disabled");
    },
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");

    if (error) {
      setError("Authentication was cancelled or failed");
      return;
    }

    if (code) {
      handleAuthCallback(code);
    } else {
      const hasTokens = localStorage.getItem("spotify_access_token");
      setIsAuthenticated(!!hasTokens);
    }
  }, []);

  const handleAuthCallback = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await spotifyLoginMutation.mutateAsync({ code });

      if (result.success && result.access_token) {
        localStorage.setItem("spotify_access_token", result.access_token);
        if (result.expires_in) {
          const expiresAt = Date.now() + result.expires_in * 1000;
          localStorage.setItem("spotify_expires_at", expiresAt.toString());
        }

        setIsAuthenticated(true);
        onAuthenticated();

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      } else {
        const errorMessage =
          "error" in result ? result.error : "Authentication failed";
        throw new Error(errorMessage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      setError("Spotify configuration is missing");
      return;
    }

    const scopes = [
      "user-read-currently-playing",
      "user-read-recently-played",
      "user-top-read",
      "user-read-playback-state",
    ].join(" ");

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;

    window.location.href = authUrl;
  };

  const handleLogout = () => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_expires_at");

    setIsAuthenticated(false);
    onClose();
  };

  if (isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-2xl p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Spotify Connected!
            </h3>
            <p className="text-gray-400 mb-6">
              Your Spotify account is now connected. You can now use the now
              playing feature.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Continue
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Disconnect
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
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Connect Spotify
          </h3>
          <p className="text-gray-400 mb-6">
            Connect your Spotify account to see what you're currently listening
            to and display it in your portfolio.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Connect with Spotify
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            <p>This will open Spotify's authorization page in a new window.</p>
            <p className="mt-1">
              We only request permission to read your currently playing track
              and recent activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
