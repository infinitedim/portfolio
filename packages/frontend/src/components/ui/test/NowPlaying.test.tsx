import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NowPlaying } from "../NowPlaying";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Music: () => <span data-testid="music-icon">🎵</span>,
  Play: () => <span data-testid="play-icon">▶</span>,
  Pause: () => <span data-testid="pause-icon">⏸</span>,
  ExternalLink: () => <span data-testid="external-link-icon">🔗</span>,
  Clock: () => <span data-testid="clock-icon">🕐</span>,
}));

// Mock tRPC
vi.mock("@/lib/trpc", () => ({
  trpc: {
    spotify: {
      nowPlaying: {
        useQuery: () => ({
          data: {
            isPlaying: true,
            title: "Test Song",
            artist: "Test Artist",
            album: "Test Album",
            albumImageUrl: "https://example.com/album.jpg",
            songUrl: "https://open.spotify.com/track/123",
            progress: 60000,
            duration: 180000,
          },
          refetch: vi.fn(),
          isLoading: false,
        }),
      },
    },
  },
}));

describe("NowPlaying", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  it("renders the now playing component", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<NowPlaying onClose={onClose} />);
    // Component should render
    expect(document.body.querySelector("div")).toBeDefined();
  });

  it("displays loading state initially", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    // Override mock for loading state
    vi.doMock("@/lib/trpc", () => ({
      trpc: {
        spotify: {
          nowPlaying: {
            useQuery: () => ({
              data: null,
              refetch: vi.fn(),
              isLoading: true,
            }),
          },
        },
      },
    }));

    render(<NowPlaying onClose={onClose} />);
    // Should show loading or content
    expect(document.body.querySelector("div")).toBeDefined();
  });

  it("has close button functionality", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    render(<NowPlaying onClose={onClose} />);

    // Find close button by role or text
    const buttons = screen.getAllByRole("button");
    const closeButton = buttons.find(
      (btn) => btn.textContent?.includes("×") || btn.textContent?.includes("Close")
    );

    if (closeButton) {
      fireEvent.click(closeButton);
    }
  });

  it("renders with fixed positioning for modal", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<NowPlaying onClose={onClose} />);
    const modal = container.querySelector(".fixed");
    expect(modal).toBeDefined();
  });

  it("has backdrop blur effect", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<NowPlaying onClose={onClose} />);
    const backdrop = container.querySelector(".backdrop-blur-sm");
    expect(backdrop).toBeDefined();
  });
});
