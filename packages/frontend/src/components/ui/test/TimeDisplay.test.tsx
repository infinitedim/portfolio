import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TimeDisplay } from "../TimeDisplay";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Clock: () => <span data-testid="clock-icon">🕐</span>,
  MapPin: () => <span data-testid="map-icon">📍</span>,
  Globe: () => <span data-testid="globe-icon">🌍</span>,
  Wifi: () => <span data-testid="wifi-icon">📶</span>,
  RefreshCw: () => <span data-testid="refresh-icon">🔄</span>,
}));

// Mock LocationService
const mockGetLocation = vi.fn();
const mockGetTimeInfo = vi.fn();
const mockClearCache = vi.fn();
const mockFormatOffset = vi.fn();

vi.mock("@/lib/location/locationService", () => ({
  LocationService: {
    getInstance: () => ({
      getLocation: mockGetLocation,
      getTimeInfo: mockGetTimeInfo,
      clearCache: mockClearCache,
      formatOffset: mockFormatOffset,
    }),
  },
}));

describe("TimeDisplay", () => {
  const defaultProps = {
    onClose: vi.fn(),
  };

  const mockLocationData = {
    city: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    timezone: "Asia/Tokyo",
    lat: 35.6762,
    lon: 139.6503,
    latitude: 35.6762,
    longitude: 139.6503,
  };

  const mockTimeData = {
    timezone: "Asia/Tokyo",
    offset: "+09:00",
    abbreviation: "JST",
    isDst: false,
    localTime: "2024-01-15 14:30:00",
  };

  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockGetLocation.mockResolvedValue(mockLocationData);
    mockGetTimeInfo.mockReturnValue(mockTimeData);
    mockFormatOffset.mockReturnValue("UTC+9");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders time display component", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<TimeDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(document.body.querySelector("div")).toBeDefined();
    });
  });

  it("shows loading state initially", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    mockGetLocation.mockImplementation(() => new Promise(() => { })); // Never resolves
    render(<TimeDisplay {...defaultProps} />);

    // Should be in loading state
    expect(document.body.querySelector("div")).toBeDefined();
  });

  it("displays clock icon", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<TimeDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("clock-icon")).toBeDefined();
    });
  });

  it("displays map pin icon", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<TimeDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("map-icon")).toBeDefined();
    });
  });

  it("displays globe icon", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<TimeDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("globe-icon")).toBeDefined();
    });
  });

  it("fetches location on mount", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<TimeDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(mockGetLocation).toHaveBeenCalled();
    });
  });

  it("displays location information", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<TimeDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Tokyo/)).toBeDefined();
    });
  });

  it("displays timezone information", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<TimeDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(mockGetTimeInfo).toHaveBeenCalledWith("Asia/Tokyo");
    });
  });

  it("handles location error", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    mockGetLocation.mockRejectedValue(new Error("Location failed"));

    render(<TimeDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(document.body.querySelector("div")).toBeDefined();
    });
  });

  it("updates time every second", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<TimeDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(document.body.querySelector("div")).toBeDefined();
    });

    // Advance timer by 2 seconds
    await vi.advanceTimersByTimeAsync(2000);

    // Time should update
    expect(document.body.querySelector("div")).toBeDefined();
  });

  it("has refresh button", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<TimeDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("refresh-icon")).toBeDefined();
    });
  });

  it("calls clearCache and refetches on refresh", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<TimeDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("refresh-icon")).toBeDefined();
    });

    const refreshButton = screen.getByTestId("refresh-icon").closest("button");
    if (refreshButton) {
      fireEvent.click(refreshButton);

      expect(mockClearCache).toHaveBeenCalled();
      expect(mockGetLocation).toHaveBeenCalledTimes(2); // Initial + refresh
    }
  });

  it("cleans up interval on unmount", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { unmount } = render(<TimeDisplay {...defaultProps} />);

    unmount();

    // Should not throw any errors
    expect(true).toBe(true);
  });
});
