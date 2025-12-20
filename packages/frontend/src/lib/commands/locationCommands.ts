import { LocationService } from "@/lib/location/locationService";
import type { Command, CommandOutput } from "@/types/terminal";

/**
 * Create a location command
 * @returns {Command} The location command
 */
export function createLocationCommand(): Command {
  return {
    name: "location",
    description: "Show current location and timezone information",
    aliases: ["loc", "time", "timezone", "where"],
    async execute(args: string[]): Promise<CommandOutput> {
      const [action, ...params] = args;

      switch (action) {
        case "time":
          return getTimeInfo(params[0]);
        case "timezone":
          return getTimezoneInfo(params[0]);
        case "weather":
          return getWeatherInfo();
        case "help":
          return showLocationHelp();
        default:
          if (!action) {
            return getLocationInfo();
          }
          return {
            type: "error",
            content: `Unknown location action: ${action}. Use 'location help' for available commands.`,
            timestamp: new Date(),
            id: "location-unknown-action",
          };
      }
    },
  };
}

/**
 * Get location information
 * @returns {Promise<CommandOutput>} The command output
 */
async function getLocationInfo(): Promise<CommandOutput> {
  try {
    const locationService = LocationService.getInstance();
    const location = await locationService.getLocation();

    if (!location) {
      return {
        type: "error",
        content:
          "🌍 **Location Unavailable**\n\nUnable to determine your location. Please check your internet connection.",
        timestamp: new Date(),
        id: "location-unavailable",
      };
    }

    const timeInfo = locationService.getTimeInfo(location.timezone);
    const weatherEmoji = locationService.getWeatherEmoji();
    const offsetFormatted = locationService.formatOffset(timeInfo.offset);

    return {
      type: "success",
      content: `🌍 **Location Information**\n\n**📍 Location:**\n  ${location.city}, ${location.region}\n  ${location.country}\n\n**🕐 Time:**\n  ${timeInfo.localTime}\n  ${timeInfo.timezone} (${offsetFormatted})\n  ${timeInfo.isDST ? "DST Active" : "Standard Time"}\n\n**🌐 Coordinates:**\n  ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}\n\n**🌤️ Weather:** ${weatherEmoji}\n\n**📡 IP:** ${location.ip}`,
      timestamp: new Date(),
      id: "location-info",
    };
  } catch (error) {
    return {
      type: "error",
      content: `Failed to fetch location information: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      id: "location-error",
    };
  }
}

/**
 * Get time information
 * @param {string} timezone - The timezone to get information for
 * @returns {Promise<CommandOutput>} The command output
 */
async function getTimeInfo(timezone?: string): Promise<CommandOutput> {
  try {
    const locationService = LocationService.getInstance();
    const location = await locationService.getLocation();
    const targetTimezone = timezone || location?.timezone || "UTC";

    const timeInfo = locationService.getTimeInfo(targetTimezone);
    const offsetFormatted = locationService.formatOffset(timeInfo.offset);

    return {
      type: "success",
      content: `🕐 **Time Information**\n\n**Timezone:** ${timeInfo.timezone}\n**Local Time:** ${timeInfo.localTime}\n**UTC Time:** ${timeInfo.utcTime}\n**Offset:** ${offsetFormatted}\n**DST:** ${timeInfo.isDST ? "Active" : "Inactive"}`,
      timestamp: new Date(),
      id: "time-info",
    };
  } catch (error) {
    return {
      type: "error",
      content: `Failed to get time information: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      id: "time-error",
    };
  }
}

/**
 * Get timezone information
 * @param {string} timezone - The timezone to get information for
 * @returns {Promise<CommandOutput>} The command output
 */
async function getTimezoneInfo(timezone?: string): Promise<CommandOutput> {
  try {
    const locationService = LocationService.getInstance();
    const location = await locationService.getLocation();
    const targetTimezone = timezone || location?.timezone || "UTC";

    const timeInfo = locationService.getTimeInfo(targetTimezone);
    const offsetFormatted = locationService.formatOffset(timeInfo.offset);

    const majorTimezones = [
      "UTC",
      "America/New_York",
      "America/Los_Angeles",
      "Europe/London",
      "Europe/Paris",
      "Asia/Tokyo",
      "Australia/Sydney",
    ];

    const timezoneComparisons = majorTimezones
      .filter((tz) => tz !== targetTimezone)
      .map((tz) => {
        const tzInfo = locationService.getTimeInfo(tz);
        const tzOffset = locationService.formatOffset(tzInfo.offset);
        return `  ${tz}: ${tzInfo.localTime} (${tzOffset})`;
      })
      .join("\n");

    return {
      type: "success",
      content: `🌐 **Timezone Information**\n\n**Current:** ${targetTimezone} (${offsetFormatted})\n**Local Time:** ${timeInfo.localTime}\n**DST:** ${timeInfo.isDST ? "Active" : "Inactive"}\n\n**Other Major Timezones:**\n${timezoneComparisons}`,
      timestamp: new Date(),
      id: "timezone-info",
    };
  } catch (error) {
    return {
      type: "error",
      content: `Failed to get timezone information: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      id: "timezone-error",
    };
  }
}

/**
 * Get weather information
 * @returns {Promise<CommandOutput>} The command output
 */
async function getWeatherInfo(): Promise<CommandOutput> {
  try {
    const locationService = LocationService.getInstance();
    const location = await locationService.getLocation();

    if (!location) {
      return {
        type: "error",
        content:
          "🌤️ **Weather Unavailable**\n\nUnable to determine your location for weather information.",
        timestamp: new Date(),
        id: "weather-unavailable",
      };
    }

    const weatherEmoji = locationService.getWeatherEmoji();
    const now = new Date();
    const hour = now.getHours();
    const isDay = hour >= 6 && hour < 18;

    return {
      type: "success",
      content: `🌤️ **Weather Information**\n\n**Location:** ${location.city}, ${location.country}\n**Condition:** ${weatherEmoji} ${isDay ? "Day" : "Night"}\n**Coordinates:** ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}\n\n*Note: This is a simplified weather display based on time and season.*`,
      timestamp: new Date(),
      id: "weather-info",
    };
  } catch (error) {
    return {
      type: "error",
      content: `Failed to get weather information: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      id: "weather-error",
    };
  }
}

/**
 * Show location help
 * @returns {CommandOutput} The command output
 */
function showLocationHelp(): CommandOutput {
  return {
    type: "info",
    content:
      "🌍 **Location Commands**\n\n**Usage:**\n  location [action] [options]\n\n**Actions:**\n  (no action)   - Show current location and time\n  time [tz]     - Show time information for timezone\n  timezone [tz] - Show timezone comparisons\n  weather       - Show weather information\n  help          - Show this help\n\n**Examples:**\n  location\n  location time\n  location timezone America/New_York\n  location weather\n\n**Aliases:** loc, time, timezone, where",
    timestamp: new Date(),
    id: "location-help",
  };
}
