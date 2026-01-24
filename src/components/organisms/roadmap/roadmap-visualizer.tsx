"use client";

import { useState, JSX } from "react";
import { useTheme } from "@/hooks/use-theme";
import type { RoadmapData } from "@/types/roadmap";
import { SkillCard } from "@/components/molecules/roadmap/skill-card";
import { ProgressBar } from "@/components/molecules/roadmap/progress-bar";

interface RoadmapVisualizerProps {
  roadmapData: RoadmapData;
}

/**
 * A visual component for displaying the roadmap data in different views.
 * @param {RoadmapVisualizerProps} props - The properties for the RoadmapVisualizer component.
 * @param {RoadmapData} props.roadmapData - The roadmap data to visualize.
 * @returns {JSX.Element} - A roadmap visualizer component.
 */
export function RoadmapVisualizer({
  roadmapData,
}: RoadmapVisualizerProps): JSX.Element {
  const { themeConfig, theme } = useTheme();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "progress">(
    "grid",
  );

  const statusFilters = [
    "all",
    "completed",
    "in-progress",
    "not-started",
  ] as const;
  const [selectedFilter, setSelectedFilter] =
    useState<(typeof statusFilters)[number]>("all");

  const allSkills = roadmapData.categories.flatMap(
    (category) => category.skills,
  );
  const filteredSkills = allSkills.filter((skill) => {
    if (selectedFilter === "all") return true;
    return skill.status === selectedFilter;
  });

  const ViewModeButton = ({
    mode,
    icon,
    label,
  }: {
    mode: typeof viewMode;
    icon: string;
    label: string;
  }) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`px-3 py-1 text-sm rounded border transition-all duration-200 ${
        viewMode === mode ? "font-bold" : ""
      }`}
      style={{
        backgroundColor:
          viewMode === mode
            ? `${themeConfig.colors.accent}20`
            : `${themeConfig.colors.muted}20`,
        borderColor:
          viewMode === mode
            ? themeConfig.colors.accent
            : themeConfig.colors.border,
        color:
          viewMode === mode
            ? themeConfig.colors.accent
            : themeConfig.colors.text,
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div
      key={`roadmap-visualizer-${theme}`}
      className="space-y-6 font-mono"
      style={{ color: themeConfig.colors.text }}
    >
      {}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        {}
        <div className="flex gap-2">
          <ViewModeButton
            mode="grid"
            icon="📋"
            label="Grid"
          />
          <ViewModeButton
            mode="list"
            icon="📄"
            label="List"
          />
          <ViewModeButton
            mode="progress"
            icon="📊"
            label="Progress"
          />
        </div>

        {}
        <div className="flex gap-2 text-sm">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-2 py-1 rounded border transition-all duration-200 ${
                selectedFilter === filter ? "font-bold" : ""
              }`}
              style={{
                backgroundColor:
                  selectedFilter === filter
                    ? `${themeConfig.colors.accent}20`
                    : `${themeConfig.colors.muted}20`,
                borderColor:
                  selectedFilter === filter
                    ? themeConfig.colors.accent
                    : themeConfig.colors.border,
                color:
                  selectedFilter === filter
                    ? themeConfig.colors.accent
                    : themeConfig.colors.text,
              }}
            >
              {filter.replace("-", " ").toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {}
      <div className="space-y-4">
        {viewMode === "grid" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSkills.map((skill) => (
              <SkillCard
                key={skill.name}
                skill={skill}
                compact
              />
            ))}
          </div>
        )}

        {viewMode === "list" && (
          <div className="space-y-3">
            {filteredSkills.map((skill) => (
              <SkillCard
                key={skill.name}
                skill={skill}
              />
            ))}
          </div>
        )}

        {viewMode === "progress" && (
          <div className="space-y-4">
            {filteredSkills.map((skill) => (
              <div
                key={skill.name}
                className="p-3 rounded border"
                style={{
                  backgroundColor: `${themeConfig.colors.bg}80`,
                  borderColor: themeConfig.colors.border,
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-sm opacity-75">{skill.progress}%</span>
                </div>
                <ProgressBar progress={skill.progress} />
              </div>
            ))}
          </div>
        )}

        {filteredSkills.length === 0 && (
          <div className="text-center py-8 opacity-60">
            <p>No skills found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
