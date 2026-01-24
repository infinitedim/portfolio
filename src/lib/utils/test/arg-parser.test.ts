import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ArgumentParser, ParsedArgs } from "../arg-parser";

describe("argParser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("ArgumentParser class", () => {
    it("should be defined and exportable", () => {
      expect(ArgumentParser).toBeDefined();
      expect(typeof ArgumentParser).toBe("function");
    });

    it("should have static parse method", () => {
      expect(ArgumentParser.parse).toBeDefined();
      expect(typeof ArgumentParser.parse).toBe("function");
    });

    it("should have static hasFlag method", () => {
      expect(ArgumentParser.hasFlag).toBeDefined();
      expect(typeof ArgumentParser.hasFlag).toBe("function");
    });

    it("should have static hasFlagAny method", () => {
      expect(ArgumentParser.hasFlagAny).toBeDefined();
      expect(typeof ArgumentParser.hasFlagAny).toBe("function");
    });
  });

  describe("parse method", () => {
    it("should parse simple command", () => {
      const result = ArgumentParser.parse("ls");
      expect(result.command).toBe("ls");
      expect(result.subcommand).toBeUndefined();
      expect(result.flags).toEqual([]);
      expect(result.longFlags).toEqual([]);
      expect(result.positional).toEqual([]);
    });

    it("should parse command with subcommand", () => {
      const result = ArgumentParser.parse("git status");
      expect(result.command).toBe("git");
      expect(result.subcommand).toBe("status");
      expect(result.flags).toEqual([]);
      expect(result.longFlags).toEqual([]);
      expect(result.positional).toEqual([]);
    });

    it("should parse command with short flags", () => {
      const result = ArgumentParser.parse("ls -l");
      expect(result.command).toBe("ls");
      expect(result.flags).toEqual(["l"]);
      expect(result.longFlags).toEqual([]);
    });

    it("should parse command with multiple short flags", () => {
      const result = ArgumentParser.parse("ls -la");
      expect(result.command).toBe("ls");
      expect(result.flags).toEqual(["l", "a"]);
      expect(result.longFlags).toEqual([]);
    });

    it("should parse command with separate short flags", () => {
      const result = ArgumentParser.parse("ls -l -a");
      expect(result.command).toBe("ls");
      expect(result.flags).toEqual(["l", "a"]);
      expect(result.longFlags).toEqual([]);
    });

    it("should parse command with long flags", () => {
      const result = ArgumentParser.parse("ls --long");
      expect(result.command).toBe("ls");
      expect(result.flags).toEqual([]);
      expect(result.longFlags).toEqual(["long"]);
    });

    it("should parse command with multiple long flags", () => {
      const result = ArgumentParser.parse("ls --long --all");
      expect(result.command).toBe("ls");
      expect(result.flags).toEqual([]);
      expect(result.longFlags).toEqual(["long", "all"]);
    });

    it("should parse command with mixed flags", () => {
      const result = ArgumentParser.parse("ls -l --all -a");
      expect(result.command).toBe("ls");
      expect(result.flags).toEqual(["l", "a"]);
      expect(result.longFlags).toEqual(["all"]);
    });

    it("should parse command with positional arguments", () => {
      const result = ArgumentParser.parse("cp file1.txt file2.txt");
      expect(result.command).toBe("cp");
      expect(result.subcommand).toBe("file1.txt"); // First non-flag becomes subcommand
      expect(result.positional).toEqual(["file2.txt"]); // Rest are positional
    });

    it("should parse command with subcommand and positional arguments", () => {
      const result = ArgumentParser.parse("git add file1.txt file2.txt");
      expect(result.command).toBe("git");
      expect(result.subcommand).toBe("add");
      expect(result.positional).toEqual(["file1.txt", "file2.txt"]);
    });

    it("should parse complex command with all components", () => {
      const result = ArgumentParser.parse(
        "git commit -m --verbose file1.txt file2.txt",
      );
      expect(result.command).toBe("git");
      expect(result.subcommand).toBe("commit");
      expect(result.flags).toEqual(["m"]);
      expect(result.longFlags).toEqual(["verbose"]);
      expect(result.positional).toEqual(["file1.txt", "file2.txt"]);
    });

    it("should handle empty input", () => {
      const result = ArgumentParser.parse("");
      expect(result.command).toBe("");
      expect(result.subcommand).toBeUndefined();
      expect(result.flags).toEqual([]);
      expect(result.longFlags).toEqual([]);
      expect(result.positional).toEqual([]);
    });

    it("should handle whitespace-only input", () => {
      const result = ArgumentParser.parse("   ");
      expect(result.command).toBe("");
      expect(result.subcommand).toBeUndefined();
      expect(result.flags).toEqual([]);
      expect(result.longFlags).toEqual([]);
      expect(result.positional).toEqual([]);
    });

    it("should handle extra whitespace", () => {
      const result = ArgumentParser.parse("  ls   -l   --all   file.txt  ");
      expect(result.command).toBe("ls");
      expect(result.flags).toEqual(["l"]);
      expect(result.longFlags).toEqual(["all"]);
      expect(result.positional).toEqual(["file.txt"]);
    });

    it("should handle single hyphen as subcommand", () => {
      const result = ArgumentParser.parse("cat -");
      expect(result.command).toBe("cat");
      expect(result.subcommand).toBe("-"); // Single hyphen becomes subcommand
      expect(result.positional).toEqual([]);
      expect(result.flags).toEqual([]);
    });

    it("should handle double hyphen as long flag", () => {
      const result = ArgumentParser.parse("ls --");
      expect(result.command).toBe("ls");
      expect(result.longFlags).toEqual([""]);
    });

    it("should parse theme command example", () => {
      const result = ArgumentParser.parse("theme list --compact");
      expect(result.command).toBe("theme");
      expect(result.subcommand).toBe("list");
      expect(result.longFlags).toEqual(["compact"]);
    });
  });

  describe("hasFlag method", () => {
    it("should detect short flag", () => {
      const args: ParsedArgs = {
        command: "ls",
        flags: ["l", "a"],
        longFlags: [],
        positional: [],
      };

      expect(ArgumentParser.hasFlag(args, "l")).toBe(true);
      expect(ArgumentParser.hasFlag(args, "a")).toBe(true);
      expect(ArgumentParser.hasFlag(args, "h")).toBe(false);
    });

    it("should detect long flag", () => {
      const args: ParsedArgs = {
        command: "ls",
        flags: [],
        longFlags: ["long", "all"],
        positional: [],
      };

      expect(ArgumentParser.hasFlag(args, "l", "long")).toBe(true);
      expect(ArgumentParser.hasFlag(args, "a", "all")).toBe(true);
      expect(ArgumentParser.hasFlag(args, "h", "help")).toBe(false);
    });

    it("should detect either short or long flag", () => {
      const args: ParsedArgs = {
        command: "ls",
        flags: ["l"],
        longFlags: ["all"],
        positional: [],
      };

      expect(ArgumentParser.hasFlag(args, "l", "long")).toBe(true);
      expect(ArgumentParser.hasFlag(args, "a", "all")).toBe(true);
      expect(ArgumentParser.hasFlag(args, "h", "help")).toBe(false);
    });

    it("should handle missing long flag parameter", () => {
      const args: ParsedArgs = {
        command: "ls",
        flags: ["l"],
        longFlags: [],
        positional: [],
      };

      expect(ArgumentParser.hasFlag(args, "l")).toBe(true);
      expect(ArgumentParser.hasFlag(args, "a")).toBe(false);
    });
  });

  describe("hasFlagAny method", () => {
    it("should detect any of the provided flags", () => {
      const args: ParsedArgs = {
        command: "ls",
        flags: ["l"],
        longFlags: ["all"],
        positional: [],
      };

      const options = [
        { short: "l", long: "long" },
        { short: "h", long: "help" },
      ];

      expect(ArgumentParser.hasFlagAny(args, options)).toBe(true);
    });

    it("should return false when none of the flags are present", () => {
      const args: ParsedArgs = {
        command: "ls",
        flags: ["x"],
        longFlags: ["unknown"],
        positional: [],
      };

      const options = [
        { short: "l", long: "long" },
        { short: "h", long: "help" },
      ];

      expect(ArgumentParser.hasFlagAny(args, options)).toBe(false);
    });

    it("should handle options without long flags", () => {
      const args: ParsedArgs = {
        command: "ls",
        flags: ["v"],
        longFlags: [],
        positional: [],
      };

      const options = [{ short: "v" }, { short: "h", long: "help" }];

      expect(ArgumentParser.hasFlagAny(args, options)).toBe(true);
    });

    it("should handle empty options array", () => {
      const args: ParsedArgs = {
        command: "ls",
        flags: ["l"],
        longFlags: [],
        positional: [],
      };

      expect(ArgumentParser.hasFlagAny(args, [])).toBe(false);
    });

    it("should detect multiple matching flags", () => {
      const args: ParsedArgs = {
        command: "ls",
        flags: ["l", "v"],
        longFlags: ["help"],
        positional: [],
      };

      const options = [
        { short: "l", long: "long" },
        { short: "v", long: "verbose" },
        { short: "h", long: "help" },
      ];

      expect(ArgumentParser.hasFlagAny(args, options)).toBe(true);
    });
  });

  describe("ParsedArgs interface", () => {
    it("should have correct structure", () => {
      const args: ParsedArgs = {
        command: "test",
        subcommand: "sub",
        flags: ["f"],
        longFlags: ["flag"],
        positional: ["pos"],
      };

      expect(args.command).toBe("test");
      expect(args.subcommand).toBe("sub");
      expect(args.flags).toEqual(["f"]);
      expect(args.longFlags).toEqual(["flag"]);
      expect(args.positional).toEqual(["pos"]);
    });

    it("should allow optional subcommand", () => {
      const args: ParsedArgs = {
        command: "test",
        flags: [],
        longFlags: [],
        positional: [],
      };

      expect(args.subcommand).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle command with only flags", () => {
      const result = ArgumentParser.parse("ls -la --verbose");
      expect(result.command).toBe("ls");
      expect(result.subcommand).toBeUndefined();
      expect(result.flags).toEqual(["l", "a"]);
      expect(result.longFlags).toEqual(["verbose"]);
      expect(result.positional).toEqual([]);
    });

    it("should handle command with mixed arguments order", () => {
      const result = ArgumentParser.parse("git -v commit --message file.txt");
      expect(result.command).toBe("git");
      expect(result.subcommand).toBeUndefined(); // No subcommand because first non-flag is not at position 1
      expect(result.flags).toEqual(["v"]);
      expect(result.longFlags).toEqual(["message"]);
      expect(result.positional).toEqual(["commit", "file.txt"]); // Both become positional
    });

    it("should handle very long command", () => {
      const longCommand =
        "command sub -a -b -c --flag1 --flag2 --flag3 pos1 pos2 pos3 pos4";
      const result = ArgumentParser.parse(longCommand);
      expect(result.command).toBe("command");
      expect(result.subcommand).toBe("sub");
      expect(result.flags).toEqual(["a", "b", "c"]);
      expect(result.longFlags).toEqual(["flag1", "flag2", "flag3"]);
      expect(result.positional).toEqual(["pos1", "pos2", "pos3", "pos4"]);
    });
  });
});
