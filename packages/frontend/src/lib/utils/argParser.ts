/**
 * Represents the parsed result of a command-line style input string
 * @property command - The main command to execute
 * @property subcommand - Optional subcommand for nested commands
 * @property flags - Array of short flags (single character flags like -a, -b)
 * @property longFlags - Array of long flags (double dash flags like --verbose)
 * @property positional - Array of positional arguments that are not flags
 */
export interface ParsedArgs {
  command: string;
  subcommand?: string;
  flags: string[];
  longFlags: string[];
  positional: string[];
}

/**
 * A utility class for parsing command-line style arguments from strings
 * Handles short flags (-f), long flags (--flag), and positional arguments
 */
export class ArgumentParser {
  /**
   * Parses an input string into a structured command with flags and arguments
   * @param input - The raw command string to parse
   * @returns A ParsedArgs object containing the parsed command, flags, and arguments
   * @example
   * ```ts
   * const args = ArgumentParser.parse('git commit -m "message" --amend');
   * // Returns: { command: 'git', subcommand: 'commit', flags: ['m'], longFlags: ['amend'], positional: ['message'] }
   * ```
   */
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
        longFlags.push(part.slice(2));
      } else if (part.startsWith("-") && part.length > 1) {
        const shortFlags = part.slice(1).split("");
        flags.push(...shortFlags);
      } else {
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

  /**
   * Checks if the parsed arguments contain a specific flag (short or long form)
   * @param args - The parsed arguments to search
   * @param short - The short flag name (without the dash)
   * @param long - Optional long flag name (without the dashes)
   * @returns True if the flag is present in either short or long form
   * @example
   * ```ts
   * const args = ArgumentParser.parse('command -v --verbose');
   * ArgumentParser.hasFlag(args, 'v', 'verbose'); // Returns true
   * ```
   */
  static hasFlag(args: ParsedArgs, short: string, long?: string): boolean {
    return (
      args.flags.includes(short) ||
      (long ? args.longFlags.includes(long) : false)
    );
  }

  /**
   * Checks if any of the provided flag options are present in the parsed arguments
   * @param args - The parsed arguments to search
   * @param options - Array of flag option objects with short and optional long names
   * @returns True if any of the specified flags are present
   * @example
   * ```ts
   * const args = ArgumentParser.parse('command -h');
   * ArgumentParser.hasFlagAny(args, [
   *   { short: 'h', long: 'help' },
   *   { short: 'v', long: 'version' }
   * ]); // Returns true
   * ```
   */
  static hasFlagAny(
    args: ParsedArgs,
    options: Array<{ short: string; long?: string }>,
  ): boolean {
    return options.some((option) =>
      this.hasFlag(args, option.short, option.long),
    );
  }
}
