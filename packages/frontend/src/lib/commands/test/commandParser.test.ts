import { describe, it, expect } from "vitest";
import { CommandParser } from "../commandParser";

describe("CommandParser", () => {
  it("returns error for empty input", async () => {
    const parser = new CommandParser();
    const res = await parser.parse("");
    expect(res.type).toBe("error");
  });

  it("registers and invokes a command", async () => {
    const parser = new CommandParser();
    const cmd = {
      name: "echo",
      description: "echo",
      async execute(args: string[]) {
        return { type: "success", content: args.join(" ") } as any;
      },
    };

    parser.register(cmd as any);
    const out = await parser.parse("echo hello world");
    expect(out.type).toBe("success");
    expect(out.content).toBe("hello world");
  });
});
