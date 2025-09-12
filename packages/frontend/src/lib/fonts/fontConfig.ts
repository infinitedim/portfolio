import type { FontConfig, FontName } from "@portfolio/frontend/src/types/font";

export const fonts: Record<FontName, FontConfig> = {
  "jetbrains-mono": {
    name: "JetBrains Mono",
    family: "var(--font-jetbrains-mono), 'Consolas', 'Monaco', monospace",
    ligatures: true,
    weight: "400",
  },
  "fira-code": {
    name: "Fira Code",
    family: "var(--font-fira-code), 'Consolas', 'Monaco', monospace",
    ligatures: true,
    weight: "400",
  },
  "source-code-pro": {
    name: "Source Code Pro",
    family: "var(--font-source-code-pro), 'Consolas', 'Monaco', monospace",
    ligatures: false,
    weight: "400",
  },
  inconsolata: {
    name: "Inconsolata",
    family: "var(--font-inconsolata), 'Consolas', 'Monaco', monospace",
    ligatures: false,
    weight: "400",
  },
  "ubuntu-mono": {
    name: "Ubuntu Mono",
    family: "var(--font-ubuntu-mono), 'Consolas', 'Monaco', monospace",
    ligatures: false,
    weight: "400",
  },
  "roboto-mono": {
    name: "Roboto Mono",
    family: "var(--font-roboto-mono), 'Consolas', 'Monaco', monospace",
    ligatures: false,
    weight: "400",
  },
};

export const getSortedFontNames = (): FontName[] => {
  return Object.keys(fonts).sort() as FontName[];
};

export const defaultFont: FontName = "jetbrains-mono";
