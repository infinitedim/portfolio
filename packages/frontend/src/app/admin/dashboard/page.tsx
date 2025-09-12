"use client";

import { useState, useEffect, JSX } from "react";
import { useRouter } from "next/navigation";
import { TerminalHeader } from "@portfolio/frontend/src/components/admin/TerminalHeader";
import { TerminalSidebar } from "@portfolio/frontend/src/components/admin/TerminalSidebar";
import { PerformanceMonitor } from "@portfolio/frontend/src/components/admin/PerformanceMonitor";
import { LoggingMonitor } from "@portfolio/frontend/src/components/admin/LoggingMonitor";
import { BlogEditor } from "@portfolio/frontend/src/components/admin/BlogEditor";
import { BackendTestingDashboard } from "@portfolio/frontend/src/components/admin/BackendTestingDashboard";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";

type DashboardView =
  | "overview"
  | "performance"
  | "logs"
  | "blog"
  | "settings"
  | "testing";

/**
 * Admin Dashboard Page
 * @returns {JSX.Element} - Admin Dashboard Page
 */
export default function AdminDashboard(): JSX.Element {
  const router = useRouter();
  const { themeConfig } = useTheme();
  const [currentView, setCurrentView] = useState<DashboardView>("overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        router.push("/admin/login");
        return;
      }
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    router.push("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <></>;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                className="p-4 border rounded"
                style={{
                  borderColor: themeConfig.colors.border,
                  backgroundColor: themeConfig.colors.bg,
                }}
              >
                <div className="text-sm opacity-70 mb-2">System Status</div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: themeConfig.colors.success }}
                >
                  ONLINE
                </div>
                <div className="text-xs opacity-50 mt-1">
                  All systems operational
                </div>
              </div>

              <div
                className="p-4 border rounded"
                style={{
                  borderColor: themeConfig.colors.border,
                  backgroundColor: themeConfig.colors.bg,
                }}
              >
                <div className="text-sm opacity-70 mb-2">Active Sessions</div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: themeConfig.colors.accent }}
                >
                  1
                </div>
                <div className="text-xs opacity-50 mt-1">
                  Current admin session
                </div>
              </div>

              <div
                className="p-4 border rounded"
                style={{
                  borderColor: themeConfig.colors.border,
                  backgroundColor: themeConfig.colors.bg,
                }}
              >
                <div className="text-sm opacity-70 mb-2">Last Login</div>
                <div className="text-sm font-mono">
                  {new Date().toLocaleString()}
                </div>
                <div className="text-xs opacity-50 mt-1">From localhost</div>
              </div>
            </div>

            <div
              className="p-4 border rounded"
              style={{
                borderColor: themeConfig.colors.border,
                backgroundColor: themeConfig.colors.bg,
              }}
            >
              <div className="text-sm opacity-70 mb-4">Quick Actions</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: "View Logs", command: "logs", icon: "📋" },
                  {
                    label: "Monitor Performance",
                    command: "performance",
                    icon: "📊",
                  },
                  { label: "Edit Blog", command: "blog", icon: "✏️" },
                  { label: "System Settings", command: "settings", icon: "⚙️" },
                ].map((action) => (
                  <button
                    key={action.command}
                    onClick={() =>
                      setCurrentView(action.command as DashboardView)
                    }
                    className="p-3 text-left border rounded transition-all duration-200 hover:scale-105"
                    style={{
                      borderColor: themeConfig.colors.border,
                      backgroundColor: themeConfig.colors.bg,
                    }}
                  >
                    <div className="text-lg mb-1">{action.icon}</div>
                    <div className="text-xs font-mono">{action.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "performance":
        return <PerformanceMonitor themeConfig={themeConfig} />;

      case "logs":
        return <LoggingMonitor themeConfig={themeConfig} />;

      case "blog":
        return <BlogEditor themeConfig={themeConfig} />;

      case "testing":
        return <BackendTestingDashboard themeConfig={themeConfig} />;

      case "settings":
        return (
          <div
            className="p-6 border rounded"
            style={{
              borderColor: themeConfig.colors.border,
              backgroundColor: themeConfig.colors.bg,
            }}
          >
            <div
              className="text-lg font-bold mb-4"
              style={{ color: themeConfig.colors.accent }}
            >
              System Settings
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Theme:</span>
                <span className="text-sm font-mono">{themeConfig.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Font:</span>
                <span className="text-sm font-mono">JetBrains Mono</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Session Timeout:</span>
                <span className="text-sm font-mono">8 hours</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full p-3 text-center border rounded transition-colors"
                style={{
                  borderColor: themeConfig.colors.error || "#ff4444",
                  color: themeConfig.colors.error || "#ff4444",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        );

      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: themeConfig.colors.bg,
        color: themeConfig.colors.text,
        fontFamily: "JetBrains Mono, Consolas, Monaco, monospace",
      }}
    >
      {/* Terminal Header */}
      <TerminalHeader />

      {/* Main Dashboard Layout */}
      <div className="flex-1 flex">
        {/* Terminal Sidebar */}
        <TerminalSidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          themeConfig={themeConfig}
        />

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {/* View Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <span
                  className="text-sm font-mono"
                  style={{ color: themeConfig.colors.accent }}
                >
                  admin@portfolio:~$
                </span>
                <span className="text-sm opacity-70">./dashboard.sh</span>
                <span className="text-sm opacity-50">--view={currentView}</span>
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: themeConfig.colors.accent }}
              >
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)}{" "}
                Dashboard
              </div>
            </div>

            {/* View Content */}
            {renderCurrentView()}
          </div>
        </div>
      </div>
    </div>
  );
}
