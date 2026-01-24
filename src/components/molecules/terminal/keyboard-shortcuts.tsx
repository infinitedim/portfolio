"use client";

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type JSX,
} from "react";
import { useTheme } from "@/hooks/use-theme";

/**
 * Represents a single keyboard shortcut
 * @interface KeyboardShortcut
 * @property {string} id - Unique identifier for the shortcut
 * @property {string[]} keys - Array of keys that trigger the shortcut
 * @property {string} description - Human-readable description
 * @property {string} category - Category for grouping shortcuts
 * @property {() => void} action - Function to execute when triggered
 * @property {boolean} enabled - Whether the shortcut is currently enabled
 * @property {boolean} customizable - Whether users can customize this shortcut
 */
export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  category: string;
  action: () => void;
  enabled: boolean;
  customizable: boolean;
}

/**
 * Props for the KeyboardShortcut component
 * @interface KeyboardShortcutProps
 * @property {boolean} isOpen - Whether the shortcuts panel is open
 * @property {() => void} onClose - Callback when panel is closed
 * @property {KeyboardShortcut[]} shortcuts - List of available shortcuts
 * @property {(shortcutId: string, newKeys: string[]) => void} [onShortcutChange] - Callback when shortcut is customized
 * @property {string} [className] - Additional CSS classes
 */
interface KeyboardShortcutProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
  onShortcutChange?: (shortcutId: string, newKeys: string[]) => void;
  className?: string;
}

interface ShortcutCategory {
  name: string;
  icon: string;
  shortcuts: KeyboardShortcut[];
}

/**
 * Enhanced keyboard shortcuts panel with customization and visual guide
 * Displays all available keyboard shortcuts with search, categorization, and customization
 * @param {KeyboardShortcutProps} props - Component props
 * @param {boolean} props.isOpen - Panel open state
 * @param {() => void} props.onClose - Close callback
 * @param {KeyboardShortcut[]} props.shortcuts - Available shortcuts
 * @param {(shortcutId: string, newKeys: string[]) => void} [props.onShortcutChange] - Customization callback
 * @param {string} [props.className] - Additional classes
 * @returns {JSX.Element | null} The shortcuts panel or null if closed
 * @example
 * ```tsx
 * <KeyboardShortcut
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   shortcuts={shortcuts}
 *   onShortcutChange={handleShortcutChange}
 * />
 * ```
 */
export function KeyboardShortcut({
  isOpen,
  onClose,
  shortcuts,
  onShortcutChange,
  className = "",
}: KeyboardShortcutProps): JSX.Element | null {
  const { themeConfig } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [recordingKeys, setRecordingKeys] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const categories: ShortcutCategory[] = [
    {
      name: "all",
      icon: "🔧",
      shortcuts,
    },
    ...Object.entries(
      shortcuts.reduce(
        (acc, shortcut) => {
          if (!acc[shortcut.category]) {
            acc[shortcut.category] = [];
          }
          acc[shortcut.category].push(shortcut);
          return acc;
        },
        {} as Record<string, KeyboardShortcut[]>,
      ),
    ).map(([category, categoryShortcuts]) => ({
      name: category,
      icon: getCategoryIcon(category),
      shortcuts: categoryShortcuts,
    })),
  ];

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      navigation: "🧭",
      editing: "✏️",
      terminal: "💻",
      system: "⚙️",
      customization: "🎨",
      help: "❓",
      general: "🔧",
    };
    return icons[category] || "🔧";
  }

  const filteredShortcuts = shortcuts.filter((shortcut) => {
    const matchesSearch =
      searchQuery === "" ||
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.keys.some((key) =>
        key.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesCategory =
      selectedCategory === "all" || shortcut.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const key = e.key;
      const modifiers: string[] = [];

      if (e.ctrlKey) modifiers.push("Ctrl");
      if (e.altKey) modifiers.push("Alt");
      if (e.shiftKey) modifiers.push("Shift");
      if (e.metaKey) modifiers.push("Meta");

      const specialKeys = [
        "Enter",
        "Escape",
        "Tab",
        "Space",
        "Backspace",
        "Delete",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "PageUp",
        "PageDown",
      ];

      let keyName = key;
      if (specialKeys.includes(key)) {
        keyName = key;
      } else if (key.length === 1) {
        keyName = key.toUpperCase();
      }

      const newKeys = [...modifiers, keyName].filter(
        (k) => !["Control", "Alt", "Shift", "Meta"].includes(k),
      );

      if (key === "Escape") {
        setIsRecording(false);
        setEditingShortcut(null);
        setRecordingKeys([]);
        return;
      }

      if (key === "Enter" && newKeys.length > 0) {
        if (editingShortcut && onShortcutChange) {
          onShortcutChange(editingShortcut, newKeys);
        }
        setIsRecording(false);
        setEditingShortcut(null);
        setRecordingKeys([]);
        return;
      }

      setRecordingKeys(newKeys);
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isRecording, editingShortcut, onShortcutChange]);

  const handlePanelKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !isRecording) {
      onClose();
    }
  };

  const startRecording = (shortcutId: string) => {
    setEditingShortcut(shortcutId);
    setRecordingKeys([]);
    setIsRecording(true);
  };

  const renderKeyCombo = (keys: string[], isActive = false) => (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <span key={`${key}-${index}`}>
          <kbd
            className="px-2 py-1 text-xs font-mono rounded border"
            style={{
              backgroundColor: isActive
                ? themeConfig.colors.accent
                : `${themeConfig.colors.muted}20`,
              borderColor: themeConfig.colors.border,
              color: isActive ? themeConfig.colors.bg : themeConfig.colors.text,
            }}
          >
            {key}
          </kbd>
          {index < keys.length - 1 && (
            <span
              className="mx-1 text-xs"
              style={{ color: themeConfig.colors.muted }}
            >
              +
            </span>
          )}
        </span>
      ))}
    </div>
  );

  const renderShortcut = (shortcut: KeyboardShortcut) => {
    const isEditing = editingShortcut === shortcut.id;
    const keysToShow = isEditing && isRecording ? recordingKeys : shortcut.keys;

    return (
      <div
        key={shortcut.id}
        className={`group flex items-center justify-between p-3 rounded border transition-all duration-200 ${!shortcut.enabled ? "opacity-50" : ""}`}
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: `${themeConfig.colors.bg}40`,
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span
              className="text-sm font-medium"
              style={{ color: themeConfig.colors.text }}
            >
              {shortcut.description}
            </span>

            {!shortcut.enabled && (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${themeConfig.colors.warning || themeConfig.colors.accent}20`,
                  color:
                    themeConfig.colors.warning || themeConfig.colors.accent,
                }}
              >
                Disabled
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {renderKeyCombo(keysToShow, isEditing && isRecording)}

            {isEditing && isRecording && (
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{
                    backgroundColor:
                      themeConfig.colors.error || themeConfig.colors.accent,
                  }}
                />
                <span
                  className="text-xs"
                  style={{ color: themeConfig.colors.muted }}
                >
                  Recording... (Esc to cancel, Enter to save)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {shortcut.customizable && (
            <button
              type="button"
              onClick={() => startRecording(shortcut.id)}
              disabled={isRecording}
              className="px-2 py-1 text-xs rounded border transition-colors hover:bg-white/10"
              style={{
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.muted,
              }}
              title="Customize shortcut"
            >
              ✏️
            </button>
          )}

          <button
            type="button"
            onClick={() => shortcut.action()}
            className="px-2 py-1 text-xs rounded border transition-colors hover:bg-white/10"
            style={{
              borderColor: themeConfig.colors.border,
              color: themeConfig.colors.muted,
            }}
            title="Test shortcut"
          >
            ▶️
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    /* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
      style={{ backgroundColor: `${themeConfig.colors.bg}e6` }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div
        ref={containerRef}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg border shadow-2xl"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handlePanelKeyDown}
        role="dialog"
        aria-labelledby="shortcuts-panel-title"
        tabIndex={-1}
      >
        { }
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div className="flex items-center gap-4">
            <h3
              id="shortcuts-panel-title"
              className="text-lg font-semibold"
              style={{ color: themeConfig.colors.text }}
            >
              ⌨️ Keyboard Shortcuts
            </h3>

            <div className="flex items-center gap-2">
              {categories.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${selectedCategory === category.name ? "font-medium" : ""}`}
                  style={{
                    backgroundColor:
                      selectedCategory === category.name
                        ? `${themeConfig.colors.accent}20`
                        : "transparent",
                    color:
                      selectedCategory === category.name
                        ? themeConfig.colors.accent
                        : themeConfig.colors.muted,
                  }}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded text-sm transition-colors"
            style={{
              color: themeConfig.colors.muted,
              backgroundColor: "transparent",
            }}
          >
            ✕
          </button>
        </div>

        { }
        <div
          className="p-4 border-b"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shortcuts..."
            className="w-full px-4 py-2 rounded border bg-transparent outline-none transition-colors"
            style={{
              borderColor: themeConfig.colors.border,
              color: themeConfig.colors.text,
            }}
          />
        </div>

        { }
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredShortcuts.length === 0 ? (
              <div
                className="text-center py-8 opacity-75"
                style={{ color: themeConfig.colors.muted }}
              >
                {searchQuery ? "No shortcuts found" : "No shortcuts available"}
              </div>
            ) : (
              filteredShortcuts.map(renderShortcut)
            )}
          </div>
        </div>

        { }
        <div
          className="px-4 py-3 border-t text-xs flex items-center justify-between"
          style={{
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.muted,
          }}
        >
          <div>
            Showing {filteredShortcuts.length} of {shortcuts.length} shortcuts
          </div>
          <div className="flex items-center gap-4">
            <span>Esc Close</span>
            <span>✏️ Customize</span>
            <span>▶️ Test</span>
          </div>
        </div>
      </div>
    </div>
  );
}
