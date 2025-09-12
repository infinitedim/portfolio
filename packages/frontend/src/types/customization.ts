export interface CustomFont {
  id: string;
  name: string;
  family: string;
  source: "system" | "google" | "custom";
  url?: string;
  data?: string; // Base64 encoded font data
  ligatures: boolean;
  weight: string;
  style: "normal" | "italic";
  createdAt: Date;
  preview?: string;
  size?: number; // File size in bytes
}

export interface CustomTheme {
  id: string;
  name: string;
  description?: string;
  author?: string;
  colors: {
    bg: string;
    text: string;
    prompt: string;
    success: string;
    error: string;
    accent: string;
    border: string;
    [key: string]: string; // Allow additional custom colors
  };
  source: "built-in" | "custom" | "imported";
  createdAt: Date;
  modifiedAt?: Date;
  tags?: string[];
  isDefault?: boolean;
}

export interface ThemeExport {
  version: string;
  themes: CustomTheme[];
  fonts?: CustomFont[];
  exportedAt: Date;
  exportedBy?: string;
}

export interface CustomizationSettings {
  currentTheme: string;
  currentFont: string;
  autoSave: boolean;
  previewMode: boolean;
  animations: boolean;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}
