"use client";

import type { ThemeConfig } from "@portfolio/frontend/src/types/theme";

type DashboardView =
  | "overview"
  | "performance"
  | "logs"
  | "blog"
  | "settings"
  | "testing";

interface TerminalSidebarProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  themeConfig: ThemeConfig;
}

const navigationItems = [
  { id: "overview", label: "Overview", command: "overview", icon: "🏠" },
  {
    id: "performance",
    label: "Performance",
    command: "performance",
    icon: "📊",
  },
  { id: "logs", label: "Logs", command: "logs", icon: "📋" },
  { id: "blog", label: "Blog Editor", command: "blog", icon: "✏️" },
  { id: "testing", label: "Backend Testing", command: "testing", icon: "🧪" },
  { id: "settings", label: "Settings", command: "settings", icon: "⚙️" },
];

/**
 *
 * @param root0
 * @param root0.currentView
 * @param root0.onViewChange
 * @param root0.themeConfig
 */
export function TerminalSidebar({
  currentView,
  onViewChange,
  themeConfig,
}: TerminalSidebarProps) {
  return (
    <div
      className="w-64 border-r flex flex-col"
      style={{
        borderColor: themeConfig.colors.border,
        backgroundColor: themeConfig.colors.bg,
      }}
    >
      {/* Sidebar Header */}
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
          Navigation
        </div>
        <div className="text-xs opacity-50 mt-1">Available commands</div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as DashboardView)}
            className={`w-full p-3 text-left border rounded transition-all duration-200 font-mono text-sm ${
              currentView === item.id
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
                <div className="font-medium">{item.label}</div>
                <div className="text-xs opacity-70">./{item.command}.sh</div>
              </div>
              {currentView === item.id && (
                <span className="text-xs opacity-50">▶</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* System Status */}
      <div
        className="p-4 border-t"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div
          className="text-sm font-bold mb-3"
          style={{ color: themeConfig.colors.accent }}
        >
          System Status
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="opacity-70">CPU:</span>
            <span>2.4%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="opacity-70">Memory:</span>
            <span>45.2%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="opacity-70">Network:</span>
            <span>1.2MB/s</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="opacity-70">Disk:</span>
            <span>12.8%</span>
          </div>
        </div>

        {/* Quick Commands */}
        <div
          className="mt-4 pt-4 border-t"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="text-sm font-bold mb-2"
            style={{ color: themeConfig.colors.accent }}
          >
            Quick Commands
          </div>
          <div className="space-y-1 text-xs opacity-70">
            <div>• Ctrl+R: Refresh</div>
            <div>• Ctrl+L: Clear logs</div>
            <div>• Ctrl+S: Save</div>
            <div>• Ctrl+Q: Quit</div>
          </div>
        </div>
      </div>
    </div>
  );
}
