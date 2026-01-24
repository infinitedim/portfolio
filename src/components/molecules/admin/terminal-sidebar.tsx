"use client";

import type { ThemeConfig } from "@/types/theme";
import { useI18n } from "@/hooks/use-i18n";

/**
 * Available views in the admin dashboard
 * @typedef {"overview" | "performance" | "logs" | "blog" | "settings" | "testing"} DashboardView
 */
type DashboardView =
  | "overview"
  | "performance"
  | "logs"
  | "blog"
  | "settings";

/**
 * Props for the TerminalSidebar component
 * @interface TerminalSidebarProps
 * @property {DashboardView} currentView - The currently active view
 * @property {(view: DashboardView) => void} onViewChange - Callback when view changes
 * @property {ThemeConfig} themeConfig - Theme configuration for styling
 */
interface TerminalSidebarProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  themeConfig: ThemeConfig;
}

type TranslationKey =
  | "adminOverview"
  | "adminPerformance"
  | "adminLogs"
  | "adminBlogEditor"
  | "adminBackendTesting"
  | "adminSettings";

const navigationItems: {
  id: DashboardView;
  labelKey: TranslationKey;
  command: string;
  icon: string;
}[] = [
    {
      id: "overview",
      labelKey: "adminOverview",
      command: "overview",
      icon: "🏠",
    },
    {
      id: "performance",
      labelKey: "adminPerformance",
      command: "performance",
      icon: "📊",
    },
    { id: "logs", labelKey: "adminLogs", command: "logs", icon: "📋" },
    { id: "blog", labelKey: "adminBlogEditor", command: "blog", icon: "✏️" },
    {
      id: "settings",
      labelKey: "adminSettings",
      command: "settings",
      icon: "⚙️",
    },
  ];

/**
 * Terminal-themed navigation sidebar for admin dashboard
 * Provides command-line style navigation with animated transitions and system status
 * @param {TerminalSidebarProps} props - Component props
 * @param {DashboardView} props.currentView - The currently active view
 * @param {(view: DashboardView) => void} props.onViewChange - Callback when view changes
 * @param {ThemeConfig} props.themeConfig - Theme configuration for styling
 * @returns {JSX.Element} The terminal sidebar component
 * @example
 * ```tsx
 * <TerminalSidebar
 *   currentView="overview"
 *   onViewChange={handleViewChange}
 *   themeConfig={themeConfig}
 * />
 * ```
 */
export function TerminalSidebar({
  currentView,
  onViewChange,
  themeConfig,
}: TerminalSidebarProps) {
  const { t } = useI18n();

  return (
    <div
      className="w-64 border-r flex flex-col"
      style={{
        borderColor: themeConfig.colors.border,
        backgroundColor: themeConfig.colors.bg,
      }}
    >
      { }
      <div
        className="p-4 border-b"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div className="flex items-center space-x-2 mb-2">
          <span
            className="text-sm font-mono"
            style={{ color: themeConfig.colors.accent }}
          >
            admin@portfolio:~$
          </span>
          <span className="text-sm opacity-70">ls</span>
        </div>
        <div
          className="text-lg font-bold"
          style={{ color: themeConfig.colors.accent }}
        >
          {t("adminNavigation")}
        </div>
        <div className="text-xs opacity-50 mt-1">
          {t("adminAvailableCommands")}
        </div>
      </div>

      { }
      <div className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as DashboardView)}
            className={`w-full p-3 text-left border rounded transition-all duration-200 font-mono text-sm ${currentView === item.id
                ? "scale-105"
                : "hover:scale-102 hover:opacity-80"
              }`}
            style={{
              borderColor:
                currentView === item.id
                  ? themeConfig.colors.accent
                  : themeConfig.colors.border,
              backgroundColor:
                currentView === item.id
                  ? `${themeConfig.colors.accent}20`
                  : themeConfig.colors.bg,
              color:
                currentView === item.id
                  ? themeConfig.colors.accent
                  : themeConfig.colors.text,
            }}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1">
                <div className="font-medium">{t(item.labelKey)}</div>
                <div className="text-xs opacity-70">./{item.command}.sh</div>
              </div>
              {currentView === item.id && (
                <span className="text-xs opacity-50">▶</span>
              )}
            </div>
          </button>
        ))}
      </div>

      { }
      <div
        className="p-4 border-t"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div
          className="text-sm font-bold mb-3"
          style={{ color: themeConfig.colors.accent }}
        >
          {t("adminSystemStatus")}
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="opacity-70">{t("adminCPU")}:</span>
            <span>2.4%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="opacity-70">{t("adminMemory")}:</span>
            <span>45.2%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="opacity-70">{t("adminNetwork")}:</span>
            <span>1.2MB/s</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="opacity-70">{t("adminDisk")}:</span>
            <span>12.8%</span>
          </div>
        </div>

        { }
        <div
          className="mt-4 pt-4 border-t"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="text-sm font-bold mb-2"
            style={{ color: themeConfig.colors.accent }}
          >
            {t("adminQuickCommands")}
          </div>
          <div className="space-y-1 text-xs opacity-70">
            <div>• Ctrl+R: {t("commandRefresh")}</div>
            <div>• Ctrl+L: {t("commandClear")}</div>
            <div>• Ctrl+S: {t("blogSaveDraft")}</div>
            <div>• Ctrl+Q: {t("adminLogout")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
