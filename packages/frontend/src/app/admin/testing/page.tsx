"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TerminalHeader } from "@/components/admin/TerminalHeader";
import { TerminalSidebar } from "@/components/admin/TerminalSidebar";
import { BackendTestingDashboard } from "@/components/admin/BackendTestingDashboard";
import { useTheme } from "@/hooks/useTheme";

type DashboardView =
  | "overview"
  | "performance"
  | "logs"
  | "blog"
  | "settings"
  | "testing";

/**
 * Admin testing dashboard page component
 * @returns Testing dashboard for backend system testing and monitoring
 * @remarks
 * Provides interface for:
 * - Backend API testing and validation
 * - System health monitoring
 * - Test execution and results viewing
 * - Protected route requiring admin authentication
 * - Terminal-themed UI with sidebar navigation
 * - Real-time test status updates
 */
export default function TestingDashboard() {
  const router = useRouter();
  const { themeConfig } = useTheme();
  const [currentView, setCurrentView] = useState<DashboardView>("testing");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  /**
   * Handles user logout
   * Clears authentication token and redirects to login page
   */
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
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      { }
      <TerminalHeader
        onLogout={handleLogout}
        themeConfig={themeConfig}
      />

      { }
      <div className="flex flex-1 overflow-hidden">
        { }
        <TerminalSidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          themeConfig={themeConfig}
        />

        { }
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <BackendTestingDashboard themeConfig={themeConfig} />
          </div>
        </div>
      </div>
    </div>
  );
}
