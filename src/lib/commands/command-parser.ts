import type { Command, CommandOutput } from "@/types/terminal";
import { generateId } from "@/lib/utils/utils";
import { TypoTolerance } from "./typo-tolerance";

/**
 * Parser for terminal-style commands with registration and execution capabilities
 * Provides command registration, parsing, and typo-tolerant command lookup
 *
 * @example
 * ```ts
 * const parser = new CommandParser();
 * parser.register({ name: 'help', description: 'Show help', execute: async () => {...} });
 * const output = await parser.parse('help');
 * ```
 */
export class CommandParser {
  private commands: Map<string, Command> = new Map();

  /**
   * Registers a command and its aliases in the command registry
   * @param command - Command object with name, description, aliases, and execute function
   * @example
   * ```ts
   * parser.register({
   *   name: 'clear',
   *   description: 'Clear terminal',
   *   aliases: ['cls'],
   *   execute: async () => ({ type: 'success', content: '', ... })
   * });
   * ```
   */
  register(command: Command): void {
    if (!command) return;
    this.commands.set(command.name.toLowerCase(), command);
    command.aliases?.forEach((alias) =>
      this.commands.set(alias.toLowerCase(), command),
    );
  }

  /**
   * Retrieves all registered commands (unique by command name, excluding aliases)
   * @returns Array of unique Command objects
   * @example
   * ```ts
   * const allCommands = parser.getCommands();
   * console.log(allCommands.map(cmd => cmd.name));
   * ```
   */
  getCommands(): Command[] {
    const uniqueCommands = new Map<string, Command>();
    for (const command of Array.from(this.commands.values())) {
      uniqueCommands.set(command.name, command);
    }
    return Array.from(uniqueCommands.values());
  }

  /**
   * Parses and executes a command string with arguments
   * Provides typo-tolerant command suggestions for unknown commands
   * @param input - Raw command input string (e.g., "help" or "theme dracula")
   * @returns Promise resolving to CommandOutput with result or error
   * @example
   * ```ts
   * const output = await parser.parse('theme dracula');
   * if (output.type === 'success') {
   *   console.log(output.content);
   * }
   * ```
   */
  async parse(input: string): Promise<CommandOutput> {
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      return {
        type: "error",
        content:
          "Please enter a command. Type 'help' for available commands.".replace(
            "'",

            '"',
          ),
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const [commandName, ...args] = trimmedInput.split(" ");
    const command = this.commands.get(commandName.toLowerCase());

    if (!command) {
      const availableCommands = Array.from(
        new Set(Array.from(this.commands.keys())),
      );
      const suggestion = TypoTolerance.findSimilarCommand(
        commandName,
        availableCommands,
      );

      return {
        type: "error",
        content: suggestion
          ? `Command not found. Did you mean '${suggestion}'?`
          : `Command '${commandName}' not found. Type 'help' for available commands.`,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    try {
      const usedCommandName = commandName.toLowerCase();
      if (
        command.name === "theme" ||
        command.name === "font" ||
        usedCommandName === "theme" ||
        usedCommandName === "font"
      ) {
        return await command.execute(args, trimmedInput);
      }

      return await command.execute(args);
    } catch (error) {
      return {
        type: "error",
        content: `Error executing command: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
        id: generateId(),
      };
    }
  }
}
