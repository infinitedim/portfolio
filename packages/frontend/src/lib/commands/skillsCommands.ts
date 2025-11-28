import type { Command } from "@portfolio/frontend/src/types/terminal";
import { generateId } from "@portfolio/frontend/src/lib/utils/utils";
import type { RoadmapSkill } from "@portfolio/frontend/src/types/roadmap";

// Lazy load the roadmap service to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let roadmapService: any = null;
let roadmapServicePromise: Promise<unknown> | null = null;

const getRoadmapService = async () => {
  if (typeof window === "undefined") {
    return null; // Return null during SSR
  }

  if (roadmapService) {
    return roadmapService;
  }

  if (roadmapServicePromise) {
    return await roadmapServicePromise;
  }

  roadmapServicePromise = (async () => {
    try {
      // Use dynamic import instead of require
      const { RoadmapService } =
        await import("@portfolio/frontend/src/lib/services/roadmapService");
      roadmapService = RoadmapService.getInstance();
      return roadmapService;
    } catch (error) {
      console.error("Failed to load RoadmapService:", error);
      return null;
    }
  })();

  return await roadmapServicePromise;
};

// Helper function to get service with error handling
const getServiceOrError = async () => {
  try {
    const service = await getRoadmapService();
    if (!service) {
      return {
        error: true,
        message: "Skills service is not available during server-side rendering",
      };
    }

    // MODIFICATION: Validate service has required methods
    if (typeof service.getUserProgress !== "function") {
      return {
        error: true,
        message: "Service method getUserProgress not available",
      };
    }

    if (typeof service.getCategoryProgress !== "function") {
      return {
        error: true,
        message: "Service method getCategoryProgress not available",
      };
    }

    if (typeof service.updateSkillProgress !== "function") {
      return {
        error: true,
        message: "Service method updateSkillProgress not available",
      };
    }

    if (typeof service.getSkillsByStatus !== "function") {
      return {
        error: true,
        message: "Service method getSkillsByStatus not available",
      };
    }

    if (typeof service.refreshData !== "function") {
      return {
        error: true,
        message: "Service method refreshData not available",
      };
    }

    return { service, error: false, message: "" };
  } catch (error) {
    return {
      error: true,
      message: `Failed to load skills service: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

export const skillsCommand: Command = {
  name: "skills",
  category: "skills",
  description:
    "View and manage skills from roadmap.sh integration or local progress",
  usage: "skills [overview|sync|list|update|search] [args...]",
  async execute(args) {
    const subcommand = args[0]?.toLowerCase();

    if (!subcommand || subcommand === "overview") {
      const { service, error, message } = await getServiceOrError();
      if (error) {
        return {
          type: "error",
          content: message || "An unknown error occurred",
          timestamp: new Date(),
          id: generateId(),
        };
      }
      const data = await service.getUserProgress();

      const overviewText = [
        "🗺️ Skills Progress Overview",
        "═".repeat(60),
        "",
        `👤 Profile: ${data.username}`,
        `📊 Overall Progress: ${Math.round(data.totalProgress)}%`,
        `✅ Completed Skills: ${data.completedSkills}/${data.totalSkills}`,
        `📅 Last Updated: ${data.lastUpdated.toLocaleDateString()}`,
        "",
        "📋 Skill Categories:",
        ...data.categories.map(
          (cat: {
            name: string;
            skills: Array<{ status: string }>;
            progress: number;
          }) => {
            const completed = cat.skills.filter(
              (s: { status: string }) => s.status === "completed",
            ).length;
            const total = cat.skills.length;
            const progressBar =
              "▓".repeat(Math.floor(cat.progress / 10)) +
              "░".repeat(10 - Math.floor(cat.progress / 10));
            return `  ${cat.name.padEnd(25)} [${progressBar}] ${Math.round(cat.progress)}% (${completed}/${total})`;
          },
        ),
        "",
        "💡 Available commands:",
        "  skills list [category]        - List skills by category",
        "  skills update <skill> <status> - Update skill status",
        "  skills search <query>         - Search skills",
        "  skills completed              - Show completed skills",
        "  skills progress               - Show in-progress skills",
        "  skills top                    - Show top skills",
      ].join("\n");

      return {
        type: "success",
        content: overviewText,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (subcommand === "sync") {
      const { service, error, message } = await getServiceOrError();
      if (error) {
        return {
          type: "error",
          content: message,
          timestamp: new Date(),
          id: generateId(),
        };
      }
      try {
        // Force refresh data from API
        await service.refreshData();
        const data = await service.getUserProgress();

        const syncText = [
          "🔄 Skills Sync Status",
          "═".repeat(40),
          "",
          "✅ Successfully synced with roadmap.sh API",
          `📊 Total Skills: ${data.totalSkills}`,
          `✅ Completed: ${data.completedSkills}`,
          `📅 Last Updated: ${data.lastUpdated.toLocaleDateString()}`,
          `👤 User: ${data.username}`,
          "",
          "💡 Data is cached for 5 minutes for better performance",
        ].join("\n");

        return {
          type: "success",
          content: syncText,
          timestamp: new Date(),
          id: generateId(),
        };
      } catch (error) {
        return {
          type: "error",
          content: `Failed to sync skills: ${error}`,
          timestamp: new Date(),
          id: generateId(),
        };
      }
    }

    if (subcommand === "list") {
      const { service, error, message } = await getServiceOrError();
      if (error) {
        return {
          type: "error",
          content: message,
          timestamp: new Date(),
          id: generateId(),
        };
      }
      const category = args[1]?.toLowerCase();
      const data = await service.getUserProgress();

      if (category) {
        const categoryData = await service.getCategoryProgress(category);
        if (!categoryData) {
          return {
            type: "error",
            content: `Category "${category}" not found. Available: ${data.categories.map((c: { id: string }) => c.id).join(", ")}`,
            timestamp: new Date(),
            id: generateId(),
          };
        }

        const skillsText = [
          `🛠️ ${categoryData.name.toUpperCase()} Skills`,
          "═".repeat(50),
          "",
          ...categoryData.skills.map((skill: RoadmapSkill) => {
            const statusIcon =
              skill.status === "completed"
                ? "✅"
                : skill.status === "in-progress"
                  ? "🔄"
                  : "⭕";
            const progressBar =
              "▓".repeat(Math.floor(skill.progress / 10)) +
              "░".repeat(10 - Math.floor(skill.progress / 10));
            const priorityIcon =
              skill.priority === "high"
                ? "🔥"
                : skill.priority === "medium"
                  ? "⭐"
                  : "💫";
            return `  ${statusIcon} ${priorityIcon} ${skill.name.padEnd(20)} [${progressBar}] ${skill.progress}%`;
          }),
        ].join("\n");

        return {
          type: "success",
          content: skillsText,
          timestamp: new Date(),
          id: generateId(),
        };
      } else {
        const skillsText = [
          "🛠️ All Skills by Category",
          "═".repeat(50),
          "",
          ...data.categories.flatMap(
            (cat: { name: string; skills: RoadmapSkill[] }) => [
              `📁 ${cat.name} (${cat.skills.length} skills):`,
              ...cat.skills.map((skill: RoadmapSkill) => {
                const statusIcon =
                  skill.status === "completed"
                    ? "✅"
                    : skill.status === "in-progress"
                      ? "🔄"
                      : "⭕";
                const priorityIcon =
                  skill.priority === "high"
                    ? "🔥"
                    : skill.priority === "medium"
                      ? "⭐"
                      : "💫";
                return `  ${statusIcon} ${priorityIcon} ${skill.name} (${skill.progress}%)`;
              }),
              "",
            ],
          ),
        ].join("\n");

        return {
          type: "success",
          content: skillsText,
          timestamp: new Date(),
          id: generateId(),
        };
      }
    }

    if (subcommand === "update") {
      const { service, error, message } = await getServiceOrError();
      if (error) {
        return {
          type: "error",
          content: message,
          timestamp: new Date(),
          id: generateId(),
        };
      }

      const skillName = args[1];
      const status = args[2] as RoadmapSkill["status"];

      if (!skillName || !status) {
        return {
          type: "error",
          content: [
            "Usage: skills update <skill> <status>",
            "",
            "Status options: not-started, in-progress, completed",
            "Example: skills update react completed",
          ].join("\n"),
          timestamp: new Date(),
          id: generateId(),
        };
      }

      const validStatuses = ["not-started", "in-progress", "completed"];
      if (!validStatuses.includes(status)) {
        return {
          type: "error",
          content: `Invalid status "${status}". Valid options: ${validStatuses.join(", ")}`,
          timestamp: new Date(),
          id: generateId(),
        };
      }

      const success = await service.updateSkillProgress(
        skillName.toLowerCase(),
        {
          skillId: skillName.toLowerCase(),
          status,
          progress:
            status === "completed" ? 100 : status === "in-progress" ? 50 : 0,
        },
      );

      if (success) {
        const data = await service.getUserProgress();

        return {
          type: "success",
          content: [
            `✅ Updated ${skillName} status to "${status}"`,
            "",
            `📊 New overall progress: ${Math.round(data.totalProgress)}%`,
            "💾 Progress saved automatically",
            "📊 Use 'skills overview' to see updated progress",
          ].join("\n"),
          timestamp: new Date(),
          id: generateId(),
        };
      } else {
        return {
          type: "error",
          content: `Skill "${skillName}" not found. Use 'skills list' to see available skills.`,
          timestamp: new Date(),
          id: generateId(),
        };
      }
    }

    if (subcommand === "search") {
      const { service, error, message } = await getServiceOrError();
      if (error) {
        return {
          type: "error",
          content: message,
          timestamp: new Date(),
          id: generateId(),
        };
      }

      const query = args.slice(1).join(" ");
      if (!query) {
        return {
          type: "error",
          content: "Usage: skills search <query>\nExample: skills search react",
          timestamp: new Date(),
          id: generateId(),
        };
      }

      // Simple search implementation
      const data = await service.getUserProgress();
      const results: RoadmapSkill[] = [];

      data.categories.forEach((category: { skills: RoadmapSkill[] }) => {
        category.skills.forEach((skill: RoadmapSkill) => {
          if (
            skill.name.toLowerCase().includes(query.toLowerCase()) ||
            skill.description.toLowerCase().includes(query.toLowerCase())
          ) {
            results.push(skill);
          }
        });
      });

      if (results.length === 0) {
        return {
          type: "info",
          content: `No skills found matching "${query}"`,
          timestamp: new Date(),
          id: generateId(),
        };
      }

      const searchText = [
        `🔍 Search Results for "${query}"`,
        "═".repeat(50),
        "",
        ...results.map((skill: RoadmapSkill) => {
          const statusIcon =
            skill.status === "completed"
              ? "✅"
              : skill.status === "in-progress"
                ? "🔄"
                : "⭕";
          const priorityIcon =
            skill.priority === "high"
              ? "🔥"
              : skill.priority === "medium"
                ? "⭐"
                : "💫";
          return `  ${statusIcon} ${priorityIcon} ${skill.name} (${skill.category}) - ${skill.progress}%`;
        }),
        "",
        `Found ${results.length} skill(s) matching your search.`,
      ].join("\n");

      return {
        type: "success",
        content: searchText,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (subcommand === "completed") {
      const { service, error, message } = await getServiceOrError();
      if (error) {
        return {
          type: "error",
          content: message,
          timestamp: new Date(),
          id: generateId(),
        };
      }
      const completedSkills = await service.getSkillsByStatus("completed");
      const data = await service.getUserProgress();

      const completedText = [
        "✅ Completed Skills",
        "═".repeat(40),
        "",
        ...completedSkills.map(
          (skill: RoadmapSkill) =>
            `  ✅ ${skill.name} (${skill.category}) - Recently completed`,
        ),
        "",
        `Total: ${completedSkills.length} skills completed`,
        `Progress: ${Math.round((completedSkills.length / data.totalSkills) * 100)}% of all skills`,
      ].join("\n");

      return {
        type: "success",
        content: completedText,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (subcommand === "progress" || subcommand === "in-progress") {
      const { service, error, message } = await getServiceOrError();
      if (error) {
        return {
          type: "error",
          content: message,
          timestamp: new Date(),
          id: generateId(),
        };
      }
      const inProgressSkills = await service.getSkillsByStatus("in-progress");

      const progressText = [
        "🔄 Skills In Progress",
        "═".repeat(40),
        "",
        ...inProgressSkills.map((skill: RoadmapSkill) => {
          const progressBar =
            "▓".repeat(Math.floor(skill.progress / 10)) +
            "░".repeat(10 - Math.floor(skill.progress / 10));
          const priorityIcon =
            skill.priority === "high"
              ? "🔥"
              : skill.priority === "medium"
                ? "⭐"
                : "💫";
          return `  🔄 ${priorityIcon} ${skill.name.padEnd(20)} [${progressBar}] ${skill.progress}%`;
        }),
        "",
        `Total: ${inProgressSkills.length} skills in progress`,
      ].join("\n");

      return {
        type: "success",
        content: progressText,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (subcommand === "top") {
      const { service, error, message } = await getServiceOrError();
      if (error) {
        return {
          type: "error",
          content: message,
          timestamp: new Date(),
          id: generateId(),
        };
      }
      // Get top skills by progress
      const data = await service.getUserProgress();
      const allSkills: RoadmapSkill[] = [];

      data.categories.forEach((category: { skills: RoadmapSkill[] }) => {
        allSkills.push(...category.skills);
      });

      const topSkills = allSkills
        .filter((skill) => skill.status === "completed")
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 10);

      const topText = [
        "🏆 Top Skills",
        "═".repeat(30),
        "",
        ...topSkills.map((skill, index) => {
          const rank = index + 1;
          const medal =
            rank === 1
              ? "🥇"
              : rank === 2
                ? "🥈"
                : rank === 3
                  ? "🥉"
                  : `${rank}.`;
          return `  ${medal} ${skill.name} (${skill.category}) - ${skill.progress}%`;
        }),
      ].join("\n");

      return {
        type: "success",
        content: topText,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    return {
      type: "error",
      content: [
        `Unknown subcommand: ${subcommand}`,
        "",
        "Available subcommands:",
        "  overview  - Show skills overview",
        "  sync      - Sync with external data",
        "  list      - List skills by category",
        "  update    - Update skill status",
        "  search    - Search skills",
        "  completed - Show completed skills",
        "  progress  - Show in-progress skills",
        "  top       - Show top skills",
      ].join("\n"),
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const skillsStatCommand: Command = {
  name: "skillstat",
  description: "Quick skills statistics",
  aliases: ["sstat"],
  category: "skills",
  async execute() {
    const { service, error, message } = await getServiceOrError();
    if (error) {
      return {
        type: "error",
        content: message,
        timestamp: new Date(),
        id: generateId(),
      };
    }
    const data = await service.getUserProgress();
    const inProgress = await service.getSkillsByStatus("in-progress");
    const completed = await service.getSkillsByStatus("completed");

    const statText = [
      "📊 Skills Statistics",
      "═".repeat(30),
      "",
      `🎯 Overall Progress: ${Math.round(data.totalProgress)}%`,
      `✅ Completed: ${completed.length} skills`,
      `🔄 In Progress: ${inProgress.length} skills`,
      `⭕ Not Started: ${data.totalSkills - completed.length - inProgress.length} skills`,
      "",
      "📋 By Category:",
      ...data.categories.map(
        (cat: {
          name: string;
          skills: Array<{ status: string }>;
          progress: number;
        }) => {
          const catCompleted = cat.skills.filter(
            (s: { status: string }) => s.status === "completed",
          ).length;
          return `  ${cat.name}: ${catCompleted}/${cat.skills.length} (${Math.round(cat.progress)}%)`;
        },
      ),
      "",
      "💡 Use 'skills overview' for detailed view",
    ].join("\n");

    return {
      type: "success",
      content: statText,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};
