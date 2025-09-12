import type { Command } from "@portfolio/frontend/src/types/terminal";
import { generateId } from "@portfolio/frontend/src/lib/utils/utils";
import { CustomizationService } from "@portfolio/frontend/src/lib/services/customizationService";

const customizationService = CustomizationService.getInstance();

export const customizeCommand: Command = {
  name: "customize",
  description: "Open the customization manager",
  aliases: ["custom", "appearance", "ui"],
  async execute() {
    return {
      type: "text",
      content: "OPEN_CUSTOMIZATION_MANAGER",
      timestamp: new Date(),
      id: generateId(),
    };
  },
  category: "customization",
};

export const themesCommand: Command = {
  name: "themes",
  category: "customization",
  description: "List all available themes (built-in and custom)",
  aliases: ["theme-list"],
  async execute(args) {
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === "custom") {
      const customThemes = customizationService.getCustomThemes();

      if (customThemes.length === 0) {
        return {
          type: "info",
          content: [
            "📝 No custom themes found",
            "",
            "Create custom themes using:",
            "  customize           # Open customization manager",
            "  theme-editor        # Quick theme editor",
            "",
            "Or import themes from files using the customization manager.",
          ].join("\n"),
          timestamp: new Date(),
          id: generateId(),
        };
      }

      const themeList = [
        "🎨 Custom Themes",
        "═".repeat(40),
        "",
        ...customThemes.map((theme) => {
          const modified = theme.modifiedAt
            ? ` (modified ${theme.modifiedAt.toLocaleDateString()})`
            : "";
          return `  • ${theme.name}${modified}`;
        }),
        "",
        `Total: ${customThemes.length} custom themes`,
        "",
        "💡 Use 'customize' to manage themes",
      ].join("\n");

      return {
        type: "success",
        content: themeList,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const allThemes = customizationService.getAllThemes();
    const builtInCount = allThemes.filter(
      (t) => t.source === "built-in",
    ).length;
    const customCount = allThemes.filter((t) => t.source === "custom").length;
    const importedCount = allThemes.filter(
      (t) => t.source === "imported",
    ).length;

    const themeList = [
      "🎨 All Available Themes",
      "═".repeat(50),
      "",
      "📋 Built-in Themes:",
      ...allThemes
        .filter((t) => t.source === "built-in")
        .map((theme) => `  • ${theme.name} (${theme.id})`),
      "",
      ...(customCount > 0
        ? [
            "🛠️ Custom Themes:",
            ...allThemes
              .filter((t) => t.source === "custom")
              .map((theme) => `  • ${theme.name} (custom)`),
            "",
          ]
        : []),
      ...(importedCount > 0
        ? [
            "📥 Imported Themes:",
            ...allThemes
              .filter((t) => t.source === "imported")
              .map((theme) => `  • ${theme.name} (imported)`),
            "",
          ]
        : []),
      "📊 Summary:",
      `  Built-in: ${builtInCount}`,
      `  Custom: ${customCount}`,
      `  Imported: ${importedCount}`,
      `  Total: ${allThemes.length}`,
      "",
      "💡 Commands:",
      "  themes custom       # Show only custom themes",
      "  customize           # Open theme manager",
      "  theme <name>        # Apply theme",
    ].join("\n");

    return {
      type: "success",
      content: themeList,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const fontsCommand: Command = {
  name: "fonts",
  category: "customization",
  description: "List all available fonts (system and custom)",
  aliases: ["font-list"],
  async execute(args) {
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === "custom") {
      const customFonts = customizationService.getCustomFonts();

      if (customFonts.length === 0) {
        return {
          type: "info",
          content: [
            "📝 No custom fonts found",
            "",
            "Upload custom fonts using:",
            "  customize           # Open customization manager",
            "",
            "Supported formats: .woff, .woff2, .ttf, .otf",
          ].join("\n"),
          timestamp: new Date(),
          id: generateId(),
        };
      }

      const fontList = [
        "🔤 Custom Fonts",
        "═".repeat(40),
        "",
        ...customFonts.map((font) => {
          const ligatures = font.ligatures ? " (ligatures)" : "";
          const size = font.size ? ` [${Math.round(font.size / 1024)}KB]` : "";
          return `  • ${font.name}${ligatures}${size}`;
        }),
        "",
        `Total: ${customFonts.length} custom fonts`,
        "",
        "💡 Use 'customize' to manage fonts",
      ].join("\n");

      return {
        type: "success",
        content: fontList,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const allFonts = customizationService.getAllFonts();
    const systemCount = allFonts.filter((f) => f.source === "system").length;
    const customCount = allFonts.filter((f) => f.source === "custom").length;
    const ligaturesCount = allFonts.filter((f) => f.ligatures).length;

    const fontList = [
      "🔤 All Available Fonts",
      "═".repeat(50),
      "",
      "💻 System Fonts:",
      ...allFonts
        .filter((f) => f.source === "system")
        .map(
          (font) => `  • ${font.name}${font.ligatures ? " (ligatures)" : ""}`,
        ),
      "",
      ...(customCount > 0
        ? [
            "📁 Custom Fonts:",
            ...allFonts
              .filter((f) => f.source === "custom")
              .map(
                (font) =>
                  `  • ${font.name}${font.ligatures ? " (ligatures)" : ""}`,
              ),
            "",
          ]
        : []),
      "📊 Summary:",
      `  System: ${systemCount}`,
      `  Custom: ${customCount}`,
      `  With Ligatures: ${ligaturesCount}`,
      `  Total: ${allFonts.length}`,
      "",
      "💡 Commands:",
      "  fonts custom        # Show only custom fonts",
      "  customize           # Open font manager",
      "  font <name>         # Apply font",
    ].join("\n");

    return {
      type: "success",
      content: fontList,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};
