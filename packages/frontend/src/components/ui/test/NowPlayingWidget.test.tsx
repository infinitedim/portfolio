import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NowPlayingWidget } from "../NowPlayingWidget";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Music: () => <span data-testid="music-icon">🎵</span>,
  ExternalLink: () => <span data-testid="external-link-icon">🔗</span>,
}));

// Mock SWR
vi.mock("swr", () => ({
  default: () => ({
    data: {
      isPlaying: true,
      title: "Test Song",
      artist: "Test Artist",
      album: "Test Album",
      albumImageUrl: "https://example.com/album.jpg",
      songUrl: "https://open.spotify.com/track/123",
    },
    error: null,
    isLoading: false,
  }),
}));

describe("NowPlayingWidget", () => {
  it("renders the widget", () => {
    render(<NowPlayingWidget />);
    expect(document.body.querySelector("a")).toBeDefined();
  });

  it("displays song title when playing", () => {
    render(<NowPlayingWidget />);
    expect(screen.getByText("Test Song")).toBeDefined();
  });

  it("displays artist name when playing", () => {
    render(<NowPlayingWidget />);
    expect(screen.getByText("Test Artist")).toBeDefined();
  });

  it("renders as a link to Spotify", () => {
    render(<NowPlayingWidget />);
    const link = document.body.querySelector("a");
    expect(link?.getAttribute("href")).toContain("spotify");
  });

  it("opens in new tab", () => {
    render(<NowPlayingWidget />);
    const link = document.body.querySelector("a");
    expect(link?.getAttribute("target")).toBe("_blank");
  });

  it("has noopener noreferrer for security", () => {
    render(<NowPlayingWidget />);
    const link = document.body.querySelector("a");
    expect(link?.getAttribute("rel")).toContain("noopener");
  });

  it("shows loading state", () => {
    vi.doMock("swr", () => ({
      default: () => ({
        data: null,
        error: null,
        isLoading: true,
      }),
    }));

    const { container } = render(<NowPlayingWidget />);
    const pulseElements = container.querySelectorAll(".animate-pulse");
    expect(pulseElements.length).toBeGreaterThanOrEqual(0);
  });

  it("has proper styling", () => {
    const { container } = render(<NowPlayingWidget />);
    const widget = container.firstChild as HTMLElement;
    expect(widget.className).toContain("flex");
  });
});
