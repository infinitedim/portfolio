"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TerminalLoginForm } from "@portfolio/frontend/src/components/admin/TerminalLoginForm";
import { TerminalHeader } from "@portfolio/frontend/src/components/admin/TerminalHeader";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import { useAuth } from "@portfolio/frontend/src/lib/auth/AuthContext";

/**
 *
 */
export default function AdminLoginPage() {
  const { themeConfig } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isBackHovered, setIsBackHovered] = useState(false);

  // Redirect if already authenticated
  if (!isLoading && isAuthenticated) {
    router.push("/admin");
    return null;
  }

  const handleBack = () => {
    router.push("/");
  };

  const handleLoginSuccess = () => {
    router.push("/admin");
  };

  return (
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
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md"
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
                admin@portfolio:~$ login
              </span>
            </div>

            {/* Back Button */}
            <button
              onClick={handleBack}
              onMouseEnter={() => setIsBackHovered(true)}
              onMouseLeave={() => setIsBackHovered(false)}
              className={`px-3 py-1 text-xs font-mono rounded transition-all duration-200 ${
                isBackHovered ? "scale-105" : "scale-100"
              }`}
              style={{
                backgroundColor: isBackHovered
                  ? themeConfig.colors.accent
                  : `${themeConfig.colors.accent}20`,
                color: isBackHovered
                  ? themeConfig.colors.bg
                  : themeConfig.colors.accent,
                border: `1px solid ${themeConfig.colors.accent}`,
                filter: isBackHovered
                  ? `drop-shadow(0 0 8px ${themeConfig.colors.accent}40)`
                  : "none",
              }}
            >
              ← Back
            </button>
          </div>

          {/* Terminal Content */}
          <div className="p-6">
            <div className="mb-6">
              <h1
                className="text-xl font-bold mb-2"
                style={{ color: themeConfig.colors.accent }}
              >
                🔐 Admin Authentication
              </h1>
              <p
                className="text-sm"
                style={{ color: themeConfig.colors.muted }}
              >
                Enter your credentials to access the admin panel
              </p>
            </div>

            <TerminalLoginForm
              onLoginSuccess={handleLoginSuccess}
              themeConfig={themeConfig}
            />
          </div>

          {/* Terminal Footer */}
          <div
            className="p-3 border-t text-xs text-center"
            style={{ borderColor: themeConfig.colors.border }}
          >
            <span style={{ color: themeConfig.colors.muted }}>
              Press ← Back to return to home • Use Tab to navigate • Enter to
              submit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
