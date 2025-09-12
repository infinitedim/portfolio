export interface LocationInfo {
  city: string;
  country: string;
  region: string;
  timezone: string;
  latitude: number;
  longitude: number;
  ip: string;
}

export interface TimeInfo {
  localTime: string;
  utcTime: string;
  timezone: string;
  offset: number;
  isDST: boolean;
}

export class LocationService {
  private static instance: LocationService;
  private cachedLocation: LocationInfo | null = null;
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes
  private lastFetch = 0;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async getLocation(): Promise<LocationInfo | null> {
    // Check cache
    if (
      this.cachedLocation &&
      Date.now() - this.lastFetch < this.cacheTimeout
    ) {
      return this.cachedLocation;
    }

    try {
      // Try multiple location services for better reliability
      const location = await this.fetchLocationFromService();

      if (location) {
        this.cachedLocation = location;
        this.lastFetch = Date.now();
        return location;
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    }

    return null;
  }

  private async fetchLocationFromService(): Promise<LocationInfo | null> {
    // Try ipapi.co first
    try {
      const response = await fetch("https://ipapi.co/json/");
      if (response.ok) {
        const data = await response.json();

        if (
          typeof data === "object" &&
          data !== null &&
          "city" in data &&
          typeof data.city === "string" &&
          "country_name" in data &&
          typeof data.country_name === "string" &&
          "region" in data &&
          typeof data.region === "string" &&
          "timezone" in data &&
          typeof data.timezone === "string" &&
          "latitude" in data &&
          typeof data.latitude === "number" &&
          "longitude" in data &&
          typeof data.longitude === "number" &&
          "ip" in data &&
          typeof data.ip === "string"
        ) {
          return {
            city: data.city || "Unknown",
            country: data.country_name || "Unknown",
            region: data.region || "Unknown",
            timezone: data.timezone || "UTC",
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            ip: data.ip || "Unknown",
          };
        }
      } else {
        throw new Error("Invalid response from ipapi.co");
      }
    } catch (error) {
      console.warn("ipapi.co failed", error);
      console.warn("ipapi.co failed, trying fallback...");
    }

    // Fallback to ip-api.com
    try {
      const response = await fetch("http://ip-api.com/json/");
      if (response.ok) {
        const data = await response.json();

        if (
          typeof data === "object" &&
          data !== null &&
          "status" in data &&
          typeof data.status === "string" &&
          "city" in data &&
          typeof data.city === "string" &&
          "country" in data &&
          typeof data.country === "string" &&
          "regionName" in data &&
          typeof data.regionName === "string" &&
          "timezone" in data &&
          typeof data.timezone === "string" &&
          "lat" in data &&
          typeof data.lat === "number" &&
          "lon" in data &&
          typeof data.lon === "number" &&
          "query" in data &&
          typeof data.query === "string"
        ) {
          if (data.status === "success") {
            return {
              city: data.city || "Unknown",
              country: data.country || "Unknown",
              region: data.regionName || "Unknown",
              timezone: data.timezone || "UTC",
              latitude: data.lat || 0,
              longitude: data.lon || 0,
              ip: data.query || "Unknown",
            };
          } else {
            throw new Error("Invalid response from ip-api.com");
          }
        } else {
          throw new Error("Invalid response from ip-api.com");
        }
      }
    } catch (error) {
      console.warn("ip-api.com failed", error);
      console.warn("ip-api.com failed");
    }

    return null;
  }

  getTimeInfo(timezone: string = "UTC"): TimeInfo {
    const now = new Date();
    const utcTime = now.toISOString();

    // Create a date in the specified timezone
    const localDate = new Date(
      now.toLocaleString("en-US", { timeZone: timezone }),
    );
    const localTime = localDate.toLocaleString("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Get timezone offset
    const utcOffset = now.getTimezoneOffset();
    const targetOffset = this.getTimezoneOffset(timezone);
    const offset = targetOffset - utcOffset;

    // Check if DST is in effect (simplified check)
    const jan = new Date(now.getFullYear(), 0, 1);
    const jul = new Date(now.getFullYear(), 6, 1);
    const janOffset = this.getTimezoneOffset(timezone, jan);
    const julOffset = this.getTimezoneOffset(timezone, jul);
    const isDST = Math.max(janOffset, julOffset) === targetOffset;

    return {
      localTime,
      utcTime,
      timezone,
      offset,
      isDST,
    };
  }

  private getTimezoneOffset(timezone: string, date: Date = new Date()): number {
    try {
      const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
      const target = new Date(
        date.toLocaleString("en-US", { timeZone: timezone }),
      );
      return (target.getTime() - utc.getTime()) / (1000 * 60); // Convert to minutes
    } catch {
      return 0;
    }
  }

  formatOffset(offsetMinutes: number): string {
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? "+" : "-";
    return `UTC${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  getWeatherEmoji(): string {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth();

    // Day/Night
    if (hour >= 6 && hour < 18) {
      // Day
      if (month >= 11 || month <= 1) return "❄️"; // Winter
      if (month >= 2 && month <= 4) return "🌸"; // Spring
      if (month >= 5 && month <= 7) return "☀️"; // Summer
      return "🍂"; // Fall
    } else {
      // Night
      return "🌙";
    }
  }

  clearCache(): void {
    this.cachedLocation = null;
    this.lastFetch = 0;
  }
}
