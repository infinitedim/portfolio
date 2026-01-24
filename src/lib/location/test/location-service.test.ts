import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocationService } from "@/lib/location/location-service";

const sampleIpApiResponse = {
  city: "Test City",
  country_name: "Testland",
  region: "Test Region",
  timezone: "UTC",
  latitude: 12.34,
  longitude: 56.78,
  ip: "1.2.3.4",
};

const sampleIpApiFallback = {
  status: "success",
  city: "Fallback City",
  country: "Fallbackland",
  regionName: "Fallback Region",
  timezone: "UTC",
  lat: 1.11,
  lon: 2.22,
  query: "5.6.7.8",
};

describe("LocationService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // ensure singleton reset by clearing cache
    const svc = LocationService.getInstance();
    svc.clearCache();
  });

  it("fetches location from primary service (ipapi.co)", async () => {
    Object.defineProperty(globalThis, "fetch", {
      value: vi.fn((url: string) => {
        if (url.includes("ipapi.co")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(sampleIpApiResponse),
          } as any);
        }
        return Promise.resolve({ ok: false } as any);
      }) as any,
      writable: true,
      configurable: true,
    });

    const svc = LocationService.getInstance();
    const loc = await svc.getLocation();

    expect(loc).not.toBeNull();
    expect(loc?.city).toBe("Test City");
  });

  it("falls back to ip-api.com when primary fails", async () => {
    Object.defineProperty(globalThis, "fetch", {
      value: vi.fn((url: string) => {
        if (url.includes("ipapi.co")) {
          return Promise.resolve({ ok: false } as any);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(sampleIpApiFallback),
        } as any);
      }) as any,
      writable: true,
      configurable: true,
    });

    const svc = LocationService.getInstance();
    const loc = await svc.getLocation();

    expect(loc).not.toBeNull();
    expect(loc?.city).toBe("Fallback City");
  });

  it("returns null when both services fail", async () => {
    Object.defineProperty(globalThis, "fetch", {
      value: vi.fn(() => Promise.resolve({ ok: false } as any)) as any,
      writable: true,
      configurable: true,
    });

    const svc = LocationService.getInstance();
    const loc = await svc.getLocation();

    expect(loc).toBeNull();
  });

  it("getTimeInfo and formatOffset behave as expected", () => {
    const svc = LocationService.getInstance();
    const timeInfo = svc.getTimeInfo("UTC");
    expect(timeInfo.timezone).toBe("UTC");

    const offsetStr = svc.formatOffset(90);
    expect(offsetStr.startsWith("UTC+")).toBe(true);
  });

  it("getWeatherEmoji returns a string and changes by hour", () => {
    const svc = LocationService.getInstance();
    const emoji = svc.getWeatherEmoji();
    expect(typeof emoji).toBe("string");
  });
});
