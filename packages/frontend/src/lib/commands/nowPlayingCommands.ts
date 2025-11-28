import type {
  Command,
  CommandOutput,
} from "@/types/terminal";

export interface NowPlayingCommandOptions {
  onOpenNowPlaying: () => void;
  onOpenAuth: () => void;
}

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

/**
 * Create a now playing command
 * @param {NowPlayingCommandOptions} options - The options for the now playing command
 * @returns {Command} The now playing command
 */
export function createNowPlayingCommand(
  options: NowPlayingCommandOptions,
): Command {
  return {
    name: "now-playing",
    description: "Show currently playing Spotify track",
    aliases: ["spotify", "music", "np"],
    async execute(args: string[]): Promise<CommandOutput> {
      const [action] = args;

      switch (action) {
        case "auth":
          options.onOpenAuth();
          return {
            type: "success",
            content: "🎵 Opening Spotify authentication...",
            timestamp: new Date(),
            id: "spotify-auth-opened",
          };

        case "recent":
          return getRecentlyPlayed();

        case "top":
          return getTopTracks();

        case "help":
          return showNowPlayingHelp();

        default:
          if (!action) {
            // Fetch and display now playing data directly
            return await getNowPlaying();
          }
          return {
            type: "error",
            content: `Unknown now-playing action: ${action}. Use 'now-playing help' for available commands.`,
            timestamp: new Date(),
            id: "now-playing-unknown-action",
          };
      }
    },
  };
}

/**
 * Get currently playing track
 * @returns {Promise<CommandOutput>} The command output
 */
async function getNowPlaying(): Promise<CommandOutput> {
  try {
    const data = await (async () => {
      // Call backend via tRPC (placeholder until spotify router returns full shape)
      return { isPlaying: false } as SpotifyData;
    })();

    if (data.error) {
      return {
        type: "error",
        content: `🎵 Spotify Error: ${data.error}`,
        timestamp: new Date(),
        id: "spotify-error",
      };
    }

    if (!data.isPlaying) {
      return {
        type: "info",
        content:
          "🎵 **Not Currently Listening**\n\nYou're not currently playing anything on Spotify.\n\n💡 Try playing a track and run this command again!",
        timestamp: new Date(),
        id: "not-playing",
      };
    }

    // Format the now playing output
    const progressBar =
      data.progress && data.duration
        ? formatProgressBar(data.progress, data.duration)
        : "";

    const output = `🎵 **Now Playing on Spotify**

🎶 **${data.title || "Unknown Track"}**
👤 **${data.artist || "Unknown Artist"}**
💿 **${data.album || "Unknown Album"}**

${progressBar}

🔗 [Open in Spotify](${data.songUrl || "https://open.spotify.com"})`;

    return {
      type: "success",
      content: output,
      timestamp: new Date(),
      id: "now-playing-success",
    };
  } catch (error) {
    return {
      type: "error",
      content: `🎵 Failed to fetch now playing data: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      id: "now-playing-error",
    };
  }
}

/**
 * Format progress bar for terminal display
 * @param {number} progress - Current progress in milliseconds
 * @param {number} duration - Total duration in milliseconds
 * @returns {string} Formatted progress bar
 */
function formatProgressBar(progress: number, duration: number): string {
  const percentage = Math.min((progress / duration) * 100, 100);
  const barLength = 20;
  const filledLength = Math.round((percentage / 100) * barLength);

  const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);
  const currentTime = formatTime(progress);
  const totalTime = formatTime(duration);

  return `⏱️  ${currentTime} / ${totalTime}\n${bar} ${percentage.toFixed(1)}%`;
}

/**
 * Format time in milliseconds to MM:SS format
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Get recently played tracks
 * @returns {Promise<CommandOutput>} The command output
 */
async function getRecentlyPlayed(): Promise<CommandOutput> {
  try {
    // For now, return a placeholder since we need to implement this API endpoint
    return {
      type: "info",
      content:
        "🎵 **Recently Played Tracks**\n\nThis feature is coming soon!\n\n💡 Use `now-playing` to see your currently playing track.",
      timestamp: new Date(),
      id: "recent-tracks-coming-soon",
    };
  } catch (error) {
    return {
      type: "error",
      content: `Failed to fetch recently played tracks: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      id: "recent-tracks-error",
    };
  }
}

/**
 * Get top tracks
 * @returns {Promise<CommandOutput>} The command output
 */
async function getTopTracks(): Promise<CommandOutput> {
  try {
    // For now, return a placeholder since we need to implement this API endpoint
    return {
      type: "info",
      content:
        "🎵 **Your Top Tracks**\n\nThis feature is coming soon!\n\n💡 Use `now-playing` to see your currently playing track.",
      timestamp: new Date(),
      id: "top-tracks-coming-soon",
    };
  } catch (error) {
    return {
      type: "error",
      content: `Failed to fetch top tracks: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      id: "top-tracks-error",
    };
  }
}

/**
 * Show now playing help
 * @returns {CommandOutput} The command output
 */
function showNowPlayingHelp(): CommandOutput {
  return {
    type: "info",
    content:
      "🎵 **Now Playing Commands**\n\n**Usage:**\n  now-playing [action] [options]\n\n**Actions:**\n  (no action)     - Show currently playing track\n  auth            - Connect Spotify account\n  recent [limit]  - Show recently played tracks (coming soon)\n  top [limit]     - Show top tracks (coming soon)\n  help            - Show this help\n\n**Examples:**\n  now-playing\n  now-playing auth\n  now-playing recent 10\n  now-playing top 3\n\n**Aliases:** spotify, music, np\n\n💡 **Note:** Make sure you have configured your Spotify credentials in the environment variables.",
    timestamp: new Date(),
    id: "now-playing-help",
  };
}
