/* eslint-disable prettier/prettier */
"use client";

import { JSX, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@portfolio/frontend/src/components/admin/ProtectedRoute";
import { TerminalHeader } from "@portfolio/frontend/src/components/admin/TerminalHeader";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import { useAuth } from "@portfolio/frontend/src/lib/auth/AuthContext";

/**
 * @returns {JSX.Element} Admin Dashboard Page
 */
export default function AdminDashboardPage(): JSX.Element {
  const { themeConfig } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen flex flex-col"
        style={{
          backgroundColor: themeConfig.colors.bg,
          color: themeConfig.colors.text,
        }}
      >
        {/* Terminal Header */}
        <TerminalHeader />

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div
            className="max-w-4xl mx-auto"
            style={{
              backgroundColor: themeConfig.colors.bg,
              border: `1px solid ${themeConfig.colors.border}`,
              borderRadius: "8px",
              boxShadow: `0 4px 20px ${themeConfig.colors.border}20`,
            }}
          >
            {/* Terminal Window Header */}
            <div
              className="flex items-center justify-between p-3 border-b"
              style={{ borderColor: themeConfig.colors.border }}
            >
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: themeConfig.colors.error }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: themeConfig.colors.warning }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: themeConfig.colors.success }}
                  />
                </div>
                <span
                  className="text-sm font-mono"
                  style={{ color: themeConfig.colors.muted }}
                >
                  admin@portfolio:~$ dashboard
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBackToHome}
                  className="px-3 py-1 text-xs font-mono rounded transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: `${themeConfig.colors.accent}20`,
                    color: themeConfig.colors.accent,
                    border: `1px solid ${themeConfig.colors.accent}`,
                  }}
                >
                  🏠 Home
                </button>

                <button
                  onClick={handleLogout}
                  onMouseEnter={() => setIsLogoutHovered(true)}
                  onMouseLeave={() => setIsLogoutHovered(false)}
                  className={`px-3 py-1 text-xs font-mono rounded transition-all duration-200 ${isLogoutHovered ? "scale-105" : "scale-100"
                    }`}
                  style={{
                    backgroundColor: isLogoutHovered
                      ? themeConfig.colors.error
                      : `${themeConfig.colors.error}20`,
                    color: isLogoutHovered
                      ? themeConfig.colors.bg
                      : themeConfig.colors.error,
                    border: `1px solid ${themeConfig.colors.error}`,
                    filter: isLogoutHovered
                      ? `drop-shadow(0 0 8px ${themeConfig.colors.error}40)`
                      : "none",
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            </div>

            {/* Terminal Content */}
            <div className="p-6">
              <div className="mb-6">
                <h1
                  className="text-2xl font-bold mb-2"
                  style={{ color: themeConfig.colors.accent }}
                >
                  🛠️ Admin Dashboard
                </h1>
                <p
                  className="text-sm"
                  style={{ color: themeConfig.colors.muted }}
                >
                  Welcome back, {user?.email}! You have full administrative
                  access.
                </p>
              </div>

              {/* Admin Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div
                  className="p-4 rounded border"
                  style={{ borderColor: themeConfig.colors.border }}
                >
                  <h3
                    className="text-lg font-semibold mb-3"
                    style={{ color: themeConfig.colors.accent }}
                  >
                    👤 User Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span style={{ color: themeConfig.colors.muted }}>
                        User ID:
                      </span>{" "}
                      <span>{user?.userId}</span>
                    </div>
                    <div>
                      <span style={{ color: themeConfig.colors.muted }}>
                        Email:
                      </span>{" "}
                      <span>{user?.email}</span>
                    </div>
                    <div>
                      <span style={{ color: themeConfig.colors.muted }}>
                        Role:
                      </span>{" "}
                      <span
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: `${themeConfig.colors.success}20`,
                          color: themeConfig.colors.success,
                        }}
                      >
                        {user?.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="p-4 rounded border"
                  style={{ borderColor: themeConfig.colors.border }}
                >
                  <h3
                    className="text-lg font-semibold mb-3"
                    style={{ color: themeConfig.colors.accent }}
                  >
                    📊 System Status
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span style={{ color: themeConfig.colors.muted }}>
                        Status:
                      </span>{" "}
                      <span
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: `${themeConfig.colors.success}20`,
                          color: themeConfig.colors.success,
                        }}
                      >
                        Online
                      </span>
                    </div>
                    <div>
                      <span style={{ color: themeConfig.colors.muted }}>
                        Last Login:
                      </span>{" "}
                      <span>{new Date().toLocaleString()}</span>
                    </div>
                    <div>
                      <span style={{ color: themeConfig.colors.muted }}>
                        Session:
                      </span>{" "}
                      <span>Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div
                className="p-4 rounded border"
                style={{ borderColor: themeConfig.colors.border }}
              >
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: themeConfig.colors.accent }}
                >
                  ⚡ Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    className="p-3 text-left rounded transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: `${themeConfig.colors.accent}10`,
                      border: `1px solid ${themeConfig.colors.accent}`,
                      color: themeConfig.colors.accent,
                    }}
                  >
                    <div className="text-lg mb-1">📝</div>
                    <div className="font-semibold">Manage Posts</div>
                    <div className="text-xs opacity-70">
                      Create and edit blog posts
                    </div>
                  </button>

                  <button
                    className="p-3 text-left rounded transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: `${themeConfig.colors.accent}10`,
                      border: `1px solid ${themeConfig.colors.accent}`,
                      color: themeConfig.colors.accent,
                    }}
                  >
                    <div className="text-lg mb-1">⚙️</div>
                    <div className="font-semibold">Settings</div>
                    <div className="text-xs opacity-70">
                      Configure system settings
                    </div>
                  </button>

                  <button
                    className="p-3 text-left rounded transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: `${themeConfig.colors.accent}10`,
                      border: `1px solid ${themeConfig.colors.accent}`,
                      color: themeConfig.colors.accent,
                    }}
                  >
                    <div className="text-lg mb-1">📊</div>
                    <div className="font-semibold">Analytics</div>
                    <div className="text-xs opacity-70">
                      View site statistics
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Terminal Footer */}
            <div
              className="p-3 border-t text-xs text-center"
              style={{ borderColor: themeConfig.colors.border }}
            >
              <span style={{ color: themeConfig.colors.muted }}>
                Admin Dashboard • Press Ctrl+L to logout • Press Ctrl+H to go
                home
              </span>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
