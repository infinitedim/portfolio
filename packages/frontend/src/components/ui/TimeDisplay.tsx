"use client";

import { useState, useEffect, JSX } from "react";
import {
  LocationService,
  type LocationInfo,
  type TimeInfo,
} from "@/lib/location/locationService";
import { Clock, MapPin, Globe, Wifi, RefreshCw } from "lucide-react";

interface TimeDisplayProps {
  onClose: () => void;
}

/**
 * TimeDisplay component
 * @param {TimeDisplayProps} props - The props for the TimeDisplay component
 * @param {Function} props.onClose - The function to close the TimeDisplay component
 * @returns {JSX.Element} The TimeDisplay component
 */
export function TimeDisplay({ onClose }: TimeDisplayProps): JSX.Element {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [timeInfo, setTimeInfo] = useState<TimeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const locationService = LocationService.getInstance();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const locationData = await locationService.getLocation();
      setLocation(locationData);

      if (locationData) {
        const timeData = locationService.getTimeInfo(locationData.timezone);
        setTimeInfo(timeData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch location");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [fetchLocation, locationService, setLocation]);

  const handleRefresh = () => {
    locationService.clearCache();
    fetchLocation();
  };

  const formatTime = (date: Date, timezone: string) => {
    return date.toLocaleString("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const getWeatherEmoji = () => {
    return locationService.getWeatherEmoji();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-2xl p-6">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Loading...
            </h3>
            <p className="text-gray-400">
              Fetching location and time information
            </p>
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
              <Globe className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Error</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!location || !timeInfo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-2xl p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Location Unavailable
            </h3>
            <p className="text-gray-400 mb-6">
              Unable to determine your location. Please check your internet
              connection.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const offsetFormatted = locationService.formatOffset(timeInfo.offset);
  const currentLocalTime = formatTime(currentTime, location.timezone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">
              Time & Location
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Time */}
          <div className="text-center mb-6">
            <div className="text-3xl font-mono font-bold text-white mb-2">
              {currentLocalTime}
            </div>
            <div className="text-sm text-gray-400">
              {timeInfo.timezone} ({offsetFormatted})
            </div>
            {timeInfo.isDST && (
              <div className="text-xs text-yellow-400 mt-1">DST Active</div>
            )}
          </div>

          {/* Location Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <MapPin className="w-5 h-5 text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">
                  {location.city}, {location.region}
                </div>
                <div className="text-gray-400 text-sm truncate">
                  {location.country}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <Globe className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium">
                  {location.latitude.toFixed(4)},{" "}
                  {location.longitude.toFixed(4)}
                </div>
                <div className="text-gray-400 text-sm">Coordinates</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <Wifi className="w-5 h-5 text-purple-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">
                  {location.ip}
                </div>
                <div className="text-gray-400 text-sm">IP Address</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <div className="w-5 h-5 shrink-0 text-center text-lg">
                {getWeatherEmoji()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium">
                  {currentTime.getHours() >= 6 && currentTime.getHours() < 18
                    ? "Day"
                    : "Night"}
                </div>
                <div className="text-gray-400 text-sm">Current Period</div>
              </div>
            </div>
          </div>

          {/* UTC Time */}
          <div className="mt-6 p-3 bg-gray-800/30 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">UTC Time</div>
              <div className="text-lg font-mono text-white">
                {currentTime.toISOString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
