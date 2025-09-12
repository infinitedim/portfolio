export type ThemeName =
  | "default"
  | "matrix"
  | "cyberpunk"
  | "dracula"
  | "monokai"
  | "solarized"
  | "gruvbox"
  | "nord"
  | "tokyo"
  | "onedark"
  | "catppuccin"
  | "synthwave"
  | "vscode"
  | "github"
  | "terminal"
  | "hacker"
  | "neon"
  | "retro"
  | "minimal"
  | "ocean"
  | "forest";

export interface ThemeColors {
  bg: string;
  text: string;
  accent: string;
  muted: string;
  border: string;
  success?: string;
  error?: string;
  warning?: string;
  info?: string;
  prompt?: string;
}

export interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  description?: string;
  author?: string;
}

export type ThemeRegistry = Record<ThemeName, ThemeConfig>;

export interface ThemeApplicationStatus {
  isApplying: boolean;
  lastApplied: ThemeName | null;
  error: string | null;
}
