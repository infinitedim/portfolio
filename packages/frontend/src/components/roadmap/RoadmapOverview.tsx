"use client";

import { useTheme } from "@/hooks/useTheme";
import type { RoadmapData } from "@/types/roadmap";
import { ProgressBar } from "./ProgressBar";
import { JSX } from "react";

interface RoadmapOverviewProps {
  roadmapData: RoadmapData;
  compact?: boolean;
}

/**
 * Displays an overview of the roadmap progress, including overall stats.
 * @param {RoadmapOverviewProps} props - The properties for the RoadmapOverview component.
 * @param {RoadmapData} props.roadmapData - The roadmap data to display.
 * @param {boolean} [props.compact] - Whether to render a compact version.
 * @returns {JSX.Element} - A roadmap overview component.
 */
export function RoadmapOverview({
  roadmapData,
  compact = false,
}: RoadmapOverviewProps): JSX.Element {
  const { themeConfig, theme } = useTheme();

  const allSkills = roadmapData.categories.flatMap(
    (category) => category.skills,
  );
  const totalSkills = allSkills.length;
  const completedSkills = allSkills.filter(
    (skill) => skill.status === "completed",
  ).length;
  const inProgressSkills = allSkills.filter(
    (skill) => skill.status === "in-progress",
  ).length;
  const overallProgress =
    totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0;

  const stats = [
    {
      label: "Total Skills",
      value: totalSkills,
      color: themeConfig.colors.text,
    },
    {
      label: "Completed",
      value: completedSkills,
      color: themeConfig.colors.success || themeConfig.colors.accent,
    },
    {
      label: "In Progress",
      value: inProgressSkills,
      color: themeConfig.colors.accent,
    },
    {
      label: "Not Started",
      value: totalSkills - completedSkills - inProgressSkills,
      color: `${themeConfig.colors.text}60`,
    },
  ];

  return (
    <div
      key={`roadmap-overview-${theme}`}
      className={`${compact ? "p-3" : "p-6"} rounded-lg border space-y-4 font-mono`}
      style={{
        backgroundColor: `${themeConfig.colors.bg}f0`,
        borderColor: themeConfig.colors.border,
        color: themeConfig.colors.text,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className={`${compact ? "text-base" : "text-lg"} font-bold`}
          style={{ color: themeConfig.colors.accent }}
        >
          📊 Roadmap Progress
        </h2>
        <div className="text-right">
          <div
            className={`${compact ? "text-lg" : "text-xl"} font-bold`}
            style={{ color: themeConfig.colors.accent }}
          >
            {overallProgress}%
          </div>
          <div className="text-xs opacity-75">Overall</div>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        progress={overallProgress}
        height={compact ? "h-2" : "h-3"}
        animated
      />

      {/* Stats Grid */}
      <div
        className={`grid ${compact ? "grid-cols-2" : "grid-cols-4"} gap-3 text-center`}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="space-y-1"
          >
            <div
              className={`${compact ? "text-lg" : "text-xl"} font-bold`}
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-xs opacity-75">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      {!compact && (
        <div
          className="pt-3 border-t text-xs opacity-75"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <p>🔗 Connected to roadmap.sh/u/infinitedim</p>
          <p>⏱️ Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
