import type React from "react";

export interface Command {
  name: string;
  description: string;
  usage?: string;
  execute: (args: string[], fullInput?: string) => Promise<CommandOutput>;
  aliases?: string[];
  category?: string;
}

export interface CommandOutput {
  type: "text" | "warning" | "component" | "error" | "success" | "info";
  content: string | React.ComponentType;
  timestamp?: Date;
  id?: string;
}

export interface TerminalHistory {
  input: string;
  output: CommandOutput;
  timestamp: Date;
}

export type Theme = "light" | "dark" | "monokai";

export interface TerminalState {
  history: TerminalHistory[];
  currentInput: string;
  isProcessing: boolean;
  theme: Theme;
}
