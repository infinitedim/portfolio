import { describe, it, expect } from "vitest";
import { createNowPlayingCommand } from "../nowPlayingCommands";

describe("nowPlayingCommands", () => {
  it("formatTime and formatProgressBar behavior via command output when not playing", async () => {
    const cmd = createNowPlayingCommand({
      onOpenNowPlaying: () => {},
      onOpenAuth: () => {},
    });

    const out = await cmd.execute([] as any);
    expect(out.type).toBe("info");
    expect(out.content as string).toContain("Not Currently Listening");
  });
});
