import type { Command, CommandOutput } from "@/types/terminal";
import { generateId } from "@/lib/utils/utils";
import { TypoTolerance } from "./typoTolerance";

export class CommandParser {
  private commands: Map<string, Command> = new Map();

  register(command: Command): void {
    if (!command) return;
    this.commands.set(command.name.toLowerCase(), command);
    command.aliases?.forEach((alias) =>
      this.commands.set(alias.toLowerCase(), command),
    );
  }

  getCommands(): Command[] {
    const uniqueCommands = new Map<string, Command>();
    for (const command of Array.from(this.commands.values())) {
      uniqueCommands.set(command.name, command);
    }
    return Array.from(uniqueCommands.values());
  }

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
      // Pass both args array and full input for commands that need to parse flags
      // Check the actual command name used (could be alias) instead of command.name
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
