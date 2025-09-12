"use client";

import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import type { RoadmapSkill } from "@portfolio/frontend/src/types/roadmap";
import { ProgressBar } from "./ProgressBar";
import { formatTimestamp } from "@portfolio/frontend/src/lib/utils/utils";
import { JSX } from "react";

interface SkillCardProps {
  skill: RoadmapSkill;
  compact?: boolean;
  showProjects?: boolean;
}

/**
 * A card component to display details of a single roadmap skill.
 * @param {SkillCardProps} props - The properties for the SkillCard component.
 * @param {RoadmapSkill} props.skill - The skill data to display.
 * @param {boolean} [props.compact] - Whether to render a compact version of the card.
 * @param {boolean} [props.showProjects] - Whether to show related projects for the skill.
 * @returns {JSX.Element} - A skill card component.
 */
export function SkillCard({
  skill,
  compact = false,
  showProjects = true,
}: SkillCardProps): JSX.Element {
  const { themeConfig, theme } = useTheme();

  const getStatusIcon = () => {
    switch (skill.status) {
      case "completed":
        return "✅";
      case "in-progress":
        return "🔄";
      case "not-started":
        return "⭕";
      default:
        return "❓";
    }
  };

  const getStatusColor = () => {
    switch (skill.status) {
      case "completed":
        return themeConfig.colors.success;
      case "in-progress":
        return themeConfig.colors.accent;
      case "not-started":
        return themeConfig.colors.text + "60";
      default:
        return themeConfig.colors.text;
    }
  };

  const getPriorityIcon = () => {
    switch (skill.priority) {
      case "high":
        return "🔴";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "";
    }
  };

  if (compact) {
    return (
      <div
        key={`skill-card-compact-${theme}-${skill.name}`}
        className="flex items-center gap-2 p-2 rounded border font-mono text-sm"
        style={{
          backgroundColor: `${themeConfig.colors.bg}80`,
          borderColor: `${themeConfig.colors.border}60`,
          color: themeConfig.colors.text,
        }}
      >
        <span>{getStatusIcon()}</span>
        <span className="flex-1">{skill.name}</span>
        <ProgressBar
          progress={skill.progress}
          height="h-1"
          className="w-16"
        />
        <span className="text-xs opacity-60">{skill.progress}%</span>
      </div>
    );
  }

  return (
    <div
      key={`skill-card-${theme}-${skill.name}`}
      className="p-4 rounded-lg border space-y-3 font-mono"
      style={{
        backgroundColor: `${themeConfig.colors.bg}f0`,
        borderColor: themeConfig.colors.border,
        color: themeConfig.colors.text,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <div>
            <h3
              className="font-bold"
              style={{ color: themeConfig.colors.accent }}
            >
              {skill.name}
            </h3>
            <p className="text-xs opacity-75">{skill.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span>{getPriorityIcon()}</span>
          <span
            className="px-2 py-1 rounded border"
            style={{
              backgroundColor: `${getStatusColor()}20`,
              borderColor: getStatusColor(),
              color: getStatusColor(),
            }}
          >
            {skill.status.replace("-", " ").toUpperCase()}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Progress</span>
          <span>{skill.progress}%</span>
        </div>
        <ProgressBar
          progress={skill.progress}
          height="h-2"
        />
      </div>

      {/* Projects */}
      {showProjects && skill.projects && skill.projects.length > 0 && (
        <div className="space-y-1">
          <p
            className="text-xs font-bold"
            style={{ color: themeConfig.colors.prompt }}
          >
            Related Projects:
          </p>
          <div className="flex flex-wrap gap-1">
            {skill.projects.map((project, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded border"
                style={{
                  backgroundColor: `${themeConfig.colors.prompt}20`,
                  borderColor: `${themeConfig.colors.prompt}60`,
                  color: themeConfig.colors.prompt,
                }}
              >
                {project}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Completion Date */}
      {skill.dateCompleted && (
        <div className="text-xs opacity-60">
          Completed: {formatTimestamp(skill.dateCompleted)}
        </div>
      )}
    </div>
  );
}
