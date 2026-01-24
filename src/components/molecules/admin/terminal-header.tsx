"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";
import type { ThemeConfig } from "@/types/theme";

/**
 * Props for the TerminalHeader component
 * @typedef {Object} TerminalHeaderProps
 * @property {() => void} [onLogout] - Callback function when user logs out
 * @property {ThemeConfig} [themeConfig] - Optional theme configuration override
 */
type TerminalHeaderProps = {
  onLogout?: () => void;
  themeConfig?: ThemeConfig;
};

/**
 * Terminal-style header for admin dashboard
 * Displays system metrics, uptime, and status information in a terminal-themed UI
 * @param {TerminalHeaderProps} props - Component props
 * @param {() => void} [props.onLogout] - Callback function when user logs out
 * @param {ThemeConfig} [props.themeConfig] - Optional theme configuration override
 * @returns {JSX.Element} The terminal header component
 * @example
 * ```tsx
 * <TerminalHeader onLogout={handleLogout} themeConfig={customTheme} />
 * ```
 */
export function TerminalHeader({
  onLogout: _onLogout,
  themeConfig: themeProp,
}: TerminalHeaderProps) {
  const { themeConfig } = useTheme();
  const { t } = useI18n();
  const resolvedTheme = themeProp ?? themeConfig;
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState({
    uptime: "",
    cpuLoad: [0, 0, 0],
    memoryUsage: 0,
    networkSpeed: 0,
    systemStatus: "online",
    processCount: 0,
    diskUsage: 0,
  });

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const startTime = Date.now();

    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(uptimeSeconds / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;
      const uptime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      const baseLoad = 0.1 + Math.random() * 0.3;
      const cpuLoad = [
        Math.round((baseLoad + Math.random() * 0.2) * 100) / 100,
        Math.round((baseLoad + Math.random() * 0.15) * 100) / 100,
        Math.round((baseLoad + Math.random() * 0.1) * 100) / 100,
      ];

      const memoryUsage = Math.round(30 + Math.random() * 40);

      const networkSpeed = Math.round(0.5 + Math.random() * 2.5);

      const processCount = Math.round(80 + Math.random() * 40);

      const diskUsage = Math.round(45 + Math.random() * 25);

      setSystemMetrics({
        uptime,
        cpuLoad,
        memoryUsage,
        networkSpeed,
        systemStatus: "online",
        processCount,
        diskUsage,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isClient]);

  const formatTime = (date: Date | null) => {
    if (!date) return "--:--:--";

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  };

  const getStatusColor = (
    metric: number,
    thresholds: { warning: number; critical: number },
  ) => {
    if (metric >= thresholds.critical)
      return themeConfig.colors.error || "#ff0000";
    if (metric >= thresholds.warning)
      return themeConfig.colors.warning || "#ffff00";
    return themeConfig.colors.success || "#00ff00";
  };

  return (
    <div
      className="border-b px-4 py-2 flex items-center justify-between text-xs font-mono"
      style={{
        borderColor: resolvedTheme.colors.border,
        backgroundColor: resolvedTheme.colors.bg,
        color: resolvedTheme.colors.text,
      }}
    >
      { }
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor:
                systemMetrics.systemStatus === "online"
                  ? resolvedTheme.colors.success || "#00ff00"
                  : resolvedTheme.colors.error || "#ff0000",
            }}
          />
          <span className="opacity-70">{t("adminSystem")}:</span>
          <span
            style={{
              color:
                systemMetrics.systemStatus === "online"
                  ? themeConfig.colors.success || "#00ff00"
                  : themeConfig.colors.error || "#ff0000",
            }}
          >
            {systemMetrics.systemStatus === "online"
              ? t("adminOnline")
              : t("adminOffline")}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="opacity-70">{t("adminUptime")}:</span>
          <span style={{ color: resolvedTheme.colors.accent }}>
            {systemMetrics.uptime}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="opacity-70">{t("adminLoad")}:</span>
          <span
            style={{
              color: getStatusColor(systemMetrics.cpuLoad[0], {
                warning: 0.7,
                critical: 0.9,
              }),
            }}
          >
            {systemMetrics.cpuLoad.map((load) => load.toFixed(2)).join(" ")}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="opacity-70">{t("adminProcesses")}:</span>
          <span style={{ color: resolvedTheme.colors.accent }}>
            {systemMetrics.processCount}
          </span>
        </div>
      </div>

      { }
      <div className="flex items-center space-x-2">
        <span
          className="font-bold"
          style={{ color: resolvedTheme.colors.accent }}
        >
          {t("adminTitle").toUpperCase()}
        </span>
        <span className="opacity-50">v1.0.0</span>
      </div>

      { }
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="opacity-70">{t("adminCPU")}:</span>
          <span
            style={{
              color: getStatusColor(systemMetrics.cpuLoad[0] * 100, {
                warning: 70,
                critical: 90,
              }),
            }}
          >
            {(systemMetrics.cpuLoad[0] * 100).toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="opacity-70">{t("adminMemory")}:</span>
          <span
            style={{
              color: getStatusColor(systemMetrics.memoryUsage, {
                warning: 80,
                critical: 95,
              }),
            }}
          >
            {systemMetrics.memoryUsage}%
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="opacity-70">{t("adminDisk")}:</span>
          <span
            style={{
              color: getStatusColor(systemMetrics.diskUsage, {
                warning: 85,
                critical: 95,
              }),
            }}
          >
            {systemMetrics.diskUsage}%
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="opacity-70">{t("adminNetwork")}:</span>
          <span style={{ color: resolvedTheme.colors.accent }}>
            {systemMetrics.networkSpeed}MB/s
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="opacity-70">{t("adminTime")}:</span>
          <span>{formatTime(currentTime)}</span>
        </div>
      </div>
    </div>
  );
}
