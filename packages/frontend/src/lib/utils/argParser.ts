export interface ParsedArgs {
  command: string;
  subcommand?: string;
  flags: string[];
  longFlags: string[];
  positional: string[];
}

export class ArgumentParser {
  static parse(input: string): ParsedArgs {
    const parts = input.trim().split(/\s+/);
    const command = parts[0] || "";

    const flags: string[] = [];
    const longFlags: string[] = [];
    const positional: string[] = [];
    let subcommand: string | undefined;

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];

      if (part.startsWith("--")) {
        // Long flag (--theme-list)
        longFlags.push(part.slice(2));
      } else if (part.startsWith("-") && part.length > 1) {
        // Short flag(s) (-l, -la, etc.)
        const shortFlags = part.slice(1).split("");
        flags.push(...shortFlags);
      } else {
        // Positional argument
        if (!subcommand && i === 1) {
          subcommand = part;
        } else {
          positional.push(part);
        }
      }
    }

    return {
      command,
      subcommand,
      flags,
      longFlags,
      positional,
    };
  }

  static hasFlag(args: ParsedArgs, short: string, long?: string): boolean {
    return (
      args.flags.includes(short) ||
      (long ? args.longFlags.includes(long) : false)
    );
  }

  static hasFlagAny(
    args: ParsedArgs,
    options: Array<{ short: string; long?: string }>,
  ): boolean {
    return options.some((option) =>
      this.hasFlag(args, option.short, option.long),
    );
  }
}
