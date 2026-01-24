export interface FontConfig {
  name: string;
  family: string;
  ligatures: boolean;
  weight: string;
}

export type FontName =
  | "jetbrains-mono"
  | "fira-code"
  | "source-code-pro"
  | "inconsolata"
  | "ubuntu-mono"
  | "roboto-mono";

/** List of valid font names for runtime validation */
export const FONT_NAMES: readonly FontName[] = [
  "jetbrains-mono",
  "fira-code",
  "source-code-pro",
  "inconsolata",
  "ubuntu-mono",
  "roboto-mono",
] as const;

/** Type guard to check if a string is a valid FontName */
export function isFontName(value: string): value is FontName {
  return FONT_NAMES.includes(value as FontName);
}
