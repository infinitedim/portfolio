import { type Command } from "@/types/terminal";

// Default aliases
const DEFAULT_ALIASES: Record<string, string> = {
  // Quick shortcuts
  h: "help",
  "?": "help",
  c: "clear",
  cls: "clear",
  l: "skills",
  s: "status",
  st: "status",

  // Theme shortcuts
  th: "theme",
  themes: "theme -l",
  dark: "theme matrix",
  light: "theme terminal",

  // Font shortcuts
  f: "font",
  fonts: "font -l",

  // Navigation shortcuts
  home: "clear",
  info: "about",
  contact: "contact",
  proj: "projects",
  exp: "experience",
  edu: "education",
  road: "roadmap",

  // Customization shortcuts
  custom: "customize",
  settings: "customize",
  config: "customize",
};

/**
 * Command alias manager
 */
export class AliasManager {
  private static instance: AliasManager;
  private aliases: Record<string, string>;

  private constructor() {
    this.aliases = { ...DEFAULT_ALIASES };
    this.loadAliases();
  }

  static getInstance(): AliasManager {
    if (!AliasManager.instance) {
      AliasManager.instance = new AliasManager();
    }
    return AliasManager.instance;
  }

  /**
   * Load aliases from localStorage
   */
  private loadAliases(): void {
    try {
      const saved = localStorage.getItem("terminal-aliases");
      if (saved) {
        const savedAliases = JSON.parse(saved);

        if (
          typeof savedAliases === "object" &&
          savedAliases !== null &&
          Object.entries(savedAliases).every(
            ([key, value]) =>
              typeof key === "string" && typeof value === "string",
          )
        )
          this.aliases = { ...DEFAULT_ALIASES, ...savedAliases };
      }
    } catch (error) {
      console.warn("Failed to load aliases:", error);
    }
  }

  /**
   * Save aliases to localStorage
   */
  private saveAliases(): void {
    try {
      // Only save custom aliases, not defaults
      const customAliases = Object.fromEntries(
        Object.entries(this.aliases).filter(
          ([key]) => !(key in DEFAULT_ALIASES),
        ),
      );
      localStorage.setItem("terminal-aliases", JSON.stringify(customAliases));
    } catch (error) {
      console.warn("Failed to save aliases:", error);
    }
  }

  /**
   * Resolve alias to actual command
   * @param {string} command - The command to resolve
   * @returns {string} The resolved command
   */
  resolve(command: string): string {
    const parts = command.trim().split(" ");
    const alias = parts[0].toLowerCase();

    if (this.aliases[alias]) {
      parts[0] = this.aliases[alias];
      return parts.join(" ");
    }

    return command;
  }

  /**
   * Add or update an alias
   * @param {string} alias - The alias to add or update
   * @param {string} command - The command to add or update
   * @returns {boolean} True if the alias was added or updated, false otherwise
   */
  addAlias(alias: string, command: string): boolean {
    if (!alias || !command) return false;

    const normalizedAlias = alias.toLowerCase().trim();

    // Prevent recursive aliases
    if (normalizedAlias === command.toLowerCase().trim()) {
      return false;
    }

    this.aliases[normalizedAlias] = command.trim();
    this.saveAliases();
    return true;
  }

  /**
   * Remove an alias
   * @param {string} alias - The alias to remove
   * @returns {boolean} True if the alias was removed, false otherwise
   */
  removeAlias(alias: string): boolean {
    const normalizedAlias = alias.toLowerCase().trim();

    // Don't allow removing default aliases
    if (normalizedAlias in DEFAULT_ALIASES) {
      return false;
    }

    if (this.aliases[normalizedAlias]) {
      delete this.aliases[normalizedAlias];
      this.saveAliases();
      return true;
    }

    return false;
  }

  /**
   * Get all aliases
   * @returns {Record<string, string>} The all aliases
   */
  getAllAliases(): Record<string, string> {
    return { ...this.aliases };
  }

  /**
   * Get custom aliases only
   * @returns {Record<string, string>} The custom aliases
   */
  getCustomAliases(): Record<string, string> {
    return Object.fromEntries(
      Object.entries(this.aliases).filter(([key]) => !(key in DEFAULT_ALIASES)),
    );
  }

  /**
   * Check if alias exists
   * @param {string} alias - The alias to check
   * @returns {boolean} True if the alias exists, false otherwise
   */
  hasAlias(alias: string): boolean {
    return alias.toLowerCase() in this.aliases;
  }

  /**
   * Reset to defaults
   */
  resetToDefaults(): void {
    this.aliases = { ...DEFAULT_ALIASES };
    localStorage.removeItem("terminal-aliases");
  }
}

/**
 * Alias command implementation
 */
export const aliasCommand: Command = {
  name: "alias",
  description: "Manage command aliases for faster typing",
  usage: "alias [options] [alias] [command]",
  category: "utility",
  execute: async (args: string[]) => {
    const aliasManager = AliasManager.getInstance();

    // Show help
    if (args.includes("-h") || args.includes("--help")) {
      return {
        type: "success" as const,
        content: [
          "🔗 Command Alias Manager",
          "═".repeat(50),
          "",
          "USAGE:",
          "  alias                    # List all aliases",
          "  alias -l, --list         # List all aliases",
          "  alias -c, --custom       # List custom aliases only",
          "  alias <alias> <command>  # Create/update alias",
          "  alias -r <alias>         # Remove alias",
          "  alias --reset            # Reset to defaults",
          "",
          "EXAMPLES:",
          "  alias ll 'skills'        # Create 'll' alias for skills",
          "  alias myth 'theme matrix' # Create theme shortcut",
          "  alias -r myth            # Remove 'myth' alias",
          "",
          "DEFAULT ALIASES:",
          "  h, ? → help              c, cls → clear",
          "  l → skills               s, st → status",
          "  th → theme               f → font",
          "  dark → theme matrix      light → theme terminal",
          "",
          "💡 Aliases are automatically saved and persist between sessions.",
        ].join("\n"),
      };
    }

    // List aliases
    if (args.length === 0 || args.includes("-l") || args.includes("--list")) {
      const aliases = aliasManager.getAllAliases();
      const aliasEntries = Object.entries(aliases);

      if (aliasEntries.length === 0) {
        return {
          type: "info" as const,
          content: "No aliases configured.",
        };
      }

      const defaultAliases = Object.entries(DEFAULT_ALIASES);
      const customAliases = Object.entries(aliasManager.getCustomAliases());

      return {
        type: "success" as const,
        content: [
          "🔗 Command Aliases",
          "═".repeat(40),
          "",
          ...(defaultAliases.length > 0
            ? [
                "📋 DEFAULT ALIASES:",
                ...defaultAliases.map(
                  ([alias, cmd]) => `  ${alias.padEnd(8)} → ${cmd}`,
                ),
                "",
              ]
            : []),
          ...(customAliases.length > 0
            ? [
                "⚙️  CUSTOM ALIASES:",
                ...customAliases.map(
                  ([alias, cmd]) => `  ${alias.padEnd(8)} → ${cmd}`,
                ),
                "",
              ]
            : []),
          `Total: ${aliasEntries.length} aliases`,
          "",
          "💡 Use 'alias -h' for help managing aliases.",
        ].join("\n"),
      };
    }

    // List custom aliases only
    if (args.includes("-c") || args.includes("--custom")) {
      const customAliases = Object.entries(aliasManager.getCustomAliases());

      if (customAliases.length === 0) {
        return {
          type: "info" as const,
          content:
            "No custom aliases configured. Use 'alias <name> <command>' to create one.",
        };
      }

      return {
        type: "success" as const,
        content: [
          "⚙️  Custom Aliases",
          "═".repeat(30),
          "",
          ...customAliases.map(
            ([alias, cmd]) => `  ${alias.padEnd(12)} → ${cmd}`,
          ),
          "",
          `Total: ${customAliases.length} custom aliases`,
        ].join("\n"),
      };
    }

    // Remove alias
    if (args.includes("-r") || args.includes("--remove")) {
      const removeIndex = args.findIndex(
        (arg) => arg === "-r" || arg === "--remove",
      );
      const aliasToRemove = args[removeIndex + 1];

      if (!aliasToRemove) {
        return {
          type: "error" as const,
          content: "Please specify an alias to remove. Usage: alias -r <alias>",
        };
      }

      const success = aliasManager.removeAlias(aliasToRemove);

      if (success) {
        return {
          type: "success" as const,
          content: `✅ Removed alias '${aliasToRemove}'`,
        };
      } else {
        return {
          type: "error" as const,
          content: `❌ Cannot remove '${aliasToRemove}' (not found or is a default alias)`,
        };
      }
    }

    // Reset to defaults
    if (args.includes("--reset")) {
      aliasManager.resetToDefaults();
      return {
        type: "success" as const,
        content: "✅ Aliases reset to defaults. All custom aliases removed.",
      };
    }

    // Create/update alias
    if (args.length >= 2) {
      const [alias, ...commandParts] = args;
      const command = commandParts.join(" ");

      const success = aliasManager.addAlias(alias, command);

      if (success) {
        return {
          type: "success" as const,
          content: `✅ Created alias: '${alias}' → '${command}'`,
        };
      } else {
        return {
          type: "error" as const,
          content: `❌ Failed to create alias '${alias}' (invalid or recursive)`,
        };
      }
    }

    return {
      type: "error" as const,
      content: "Invalid usage. Use 'alias -h' for help.",
    };
  },
};
