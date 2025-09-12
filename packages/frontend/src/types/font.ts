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
