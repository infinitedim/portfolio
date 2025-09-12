"use client";

import { useState, useEffect, JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";

/**
 * This component is a terminal header that displays the current time and portfolio metrics.
 * @returns {JSX.Element} - The HomeTerminalHeader component
 */
export function HomeTerminalHeader(): JSX.Element {
  const { themeConfig } = useTheme();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [portfolioMetrics, setPortfolioMetrics] = useState({
    projects: 8,
    skills: 15,
    experience: "5+ years",
    languages: 6,
    frameworks: 10,
    tools: 15,
    status: "online",
    lastUpdate: "00:00",
    commits: 150,
    stars: 25,
  });

  // Set client flag to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
  }, []);

  // Update time and portfolio metrics every second
  useEffect(() => {
    if (!isClient) return;

    // Use a fixed start time to ensure consistent initial values
    const startTime = Date.now();

    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Calculate experience based on start date (simulated)
      const startDate = new Date("2019-01-01"); // Simulated start date
      const experienceYears = Math.floor(
        (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365),
      );
      const experience = `${experienceYears}+ years`;

      // Use fixed base values to ensure consistent initial render
      const baseProjects = 8;
      const baseSkills = 15;
      const baseLanguages = 6;
      const baseFrameworks = 10;
      const baseCommits = 150;
      const baseStars = 25;

      // Simulate dynamic project count (based on time since component mounted)
      const timeSinceMount = now.getTime() - startTime;
      const timeBasedProjects =
        Math.floor(timeSinceMount / (1000 * 60 * 60 * 24)) + baseProjects;
      const projects = Math.min(timeBasedProjects, 15); // Cap at 15

      // Simulate skill growth over time
      const timeBasedSkills =
        Math.floor(timeSinceMount / (1000 * 60 * 60 * 12)) + baseSkills;
      const skills = Math.min(timeBasedSkills, 30); // Cap at 30

      // Simulate language and framework counts
      const languages = Math.min(
        baseLanguages + Math.floor(timeSinceMount / (1000 * 60 * 60 * 24 * 7)),
        12,
      );
      const frameworks = Math.min(
        baseFrameworks + Math.floor(timeSinceMount / (1000 * 60 * 60 * 24 * 5)),
        20,
      );

      // Simulate GitHub-like metrics
      const commits =
        Math.floor(timeSinceMount / (1000 * 60 * 30)) + baseCommits; // Commit every 30 minutes
      const stars = Math.floor(commits / 10) + baseStars; // Stars based on commits

      // Format last update time
      const lastUpdate = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });

      setPortfolioMetrics({
        projects,
        skills,
        experience,
        languages,
        frameworks,
        tools: 15, // Fixed value to avoid hydration issues
        status: "online",
        lastUpdate,
        commits,
        stars,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isClient]);

  // Format time consistently
  const formatTime = (date: Date | null) => {
    if (!date) return "--:--:--";

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  };

  // Get status color based on activity
  const getStatusColor = (
    metric: number,
    thresholds: { low: number; high: number },
  ) => {
    if (metric >= thresholds.high)
      return themeConfig.colors.success || "#00ff00";
    if (metric >= thresholds.low) return themeConfig.colors.accent;
    return themeConfig.colors.muted || "#666666";
  };

  return (
    <div
      className="border-b pl-4 pr-2 py-2 flex items-center justify-between text-xs font-mono"
      style={{
        borderColor: themeConfig.colors.border,
        backgroundColor: themeConfig.colors.bg,
        color: themeConfig.colors.text,
      }}
    >
      {/* Left side - Portfolio info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor:
                portfolioMetrics.status === "online"
                  ? themeConfig.colors.success || "#00ff00"
                  : themeConfig.colors.error || "#ff0000",
            }}
          />
          <span className="opacity-70">Status:</span>
          <span
            style={{
              color:
                portfolioMetrics.status === "online"
                  ? themeConfig.colors.success || "#00ff00"
                  : themeConfig.colors.error || "#ff0000",
            }}
          >
            {portfolioMetrics.status.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="opacity-70">Projects:</span>
          <span
            style={{
              color: getStatusColor(portfolioMetrics.projects, {
                low: 5,
                high: 10,
              }),
            }}
          >
            {portfolioMetrics.projects}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="opacity-70">Skills:</span>
          <span
            style={{
              color: getStatusColor(portfolioMetrics.skills, {
                low: 15,
                high: 25,
              }),
            }}
          >
            {portfolioMetrics.skills}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="opacity-70">Exp:</span>
          <span style={{ color: themeConfig.colors.accent }}>
            {portfolioMetrics.experience}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="opacity-70">Commits:</span>
          <span
            style={{
              color: getStatusColor(portfolioMetrics.commits, {
                low: 100,
                high: 200,
              }),
            }}
          >
            {portfolioMetrics.commits}
          </span>
        </div>
      </div>

      {/* Center - Title */}
      <div className="flex items-center space-x-2">
        <span
          className="font-bold"
          style={{ color: themeConfig.colors.accent }}
        >
          PORTFOLIO TERMINAL
        </span>
        <span className="opacity-50">v2.0.0</span>
      </div>

      {/* Right side - Tech stack and time */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="opacity-70">Lang:</span>
          <span
            style={{
              color: getStatusColor(portfolioMetrics.languages, {
                low: 5,
                high: 10,
              }),
            }}
          >
            {portfolioMetrics.languages}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="opacity-70">Frameworks:</span>
          <span
            style={{
              color: getStatusColor(portfolioMetrics.frameworks, {
                low: 10,
                high: 15,
              }),
            }}
          >
            {portfolioMetrics.frameworks}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="opacity-70">Stars:</span>
          <span
            style={{
              color: getStatusColor(portfolioMetrics.stars, {
                low: 20,
                high: 50,
              }),
            }}
          >
            {portfolioMetrics.stars}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="opacity-70">Updated:</span>
          <span style={{ color: themeConfig.colors.accent }}>
            {portfolioMetrics.lastUpdate}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="opacity-70">Time:</span>
          <span>{formatTime(currentTime)}</span>
        </div>
      </div>
    </div>
  );
}
