import { ProjectMetadataService } from "@/lib/projects/projectMetadata";
import type { Command, CommandOutput } from "@/types/terminal";

// Global callback for opening demos
let globalOnOpenDemo: ((projectId: string) => void) | null = null;

/**
 * Set the callback for opening demos
 * @param {Function} callback - The callback function
 */
export function setDemoCallback(callback: (projectId: string) => void) {
  globalOnOpenDemo = callback;
}

export const demoCommand: Command = {
  name: "demo",
  description: "Interactive project demo system",
  aliases: ["project-demo", "show-demo"],
  async execute(args: string[]): Promise<CommandOutput> {
    const [action, ...params] = args;

    switch (action) {
      case "list":
        return listProjects();
      case "open":
        return openProject(params[0]);
      case "search":
        return searchProjects(params.join(" "));
      case "tech":
        return listTechnologies();
      case "category":
        return listCategories();
      case "help":
        return showDemoHelp();
      default:
        if (!action) {
          return showDemoHelp();
        }
        return {
          type: "error",
          content: `Unknown demo action: ${action}. Use 'demo help' for available commands.`,
          timestamp: new Date(),
          id: "demo-unknown-action",
        };
    }
  },
};

/**
 * List all projects
 * @returns {CommandOutput} The command output
 */
function listProjects(): CommandOutput {
  const projectService = ProjectMetadataService.getInstance();
  const projects = projectService.getAllProjects();

  if (projects.length === 0) {
    return {
      type: "info",
      content: "No projects found.",
      timestamp: new Date(),
      id: "demo-no-projects",
    };
  }

  const projectList = projects
    .map((project, index) => {
      const demoStatus = project.demoUrl ? "🟢" : "🔴";
      const featured = project.featured ? "⭐" : "";
      return `${index + 1}. ${demoStatus} ${project.name} ${featured}\n   📝 ${project.description}\n   🏷️  ${project.technologies.join(", ")}\n   🆔 ${project.id}`;
    })
    .join("\n\n");

  return {
    type: "success",
    content: `📋 Available Projects:\n\n${projectList}\n\n💡 Use 'demo open <project-id>' to launch a demo`,
    timestamp: new Date(),
    id: "demo-list-projects",
  };
}

/**
 * Open a project demo
 * @param {string} projectId - The project ID
 * @returns {CommandOutput} The command output
 */
function openProject(projectId: string): CommandOutput {
  if (!projectId) {
    return {
      type: "error",
      content:
        "Please provide a project ID. Use 'demo list' to see available projects.",
      timestamp: new Date(),
      id: "demo-no-project-id",
    };
  }

  const projectService = ProjectMetadataService.getInstance();
  const project = projectService.getProjectById(projectId);

  if (!project) {
    return {
      type: "error",
      content: `Project '${projectId}' not found. Use 'demo list' to see available projects.`,
      timestamp: new Date(),
      id: "demo-project-not-found",
    };
  }

  if (!project.demoUrl) {
    return {
      type: "error",
      content: `Demo not available for project '${project.name}'.`,
      timestamp: new Date(),
      id: "demo-not-available",
    };
  }

  // Call the global callback if available
  if (globalOnOpenDemo) {
    globalOnOpenDemo(projectId);
  }

  return {
    type: "success",
    content: `🚀 Opening demo for ${project.name}...`,
    timestamp: new Date(),
    id: "demo-opening",
  };
}

/**
 * Search projects
 * @param {string} query - The search query
 * @returns {CommandOutput} The command output
 */
function searchProjects(query: string): CommandOutput {
  if (!query) {
    return {
      type: "error",
      content: "Please provide a search query. Usage: demo search <query>",
      timestamp: new Date(),
      id: "demo-no-search-query",
    };
  }

  const projectService = ProjectMetadataService.getInstance();
  const results = projectService.searchProjects(query);

  if (results.length === 0) {
    return {
      type: "info",
      content: `No projects found matching '${query}'.`,
      timestamp: new Date(),
      id: "demo-search-no-results",
    };
  }

  const resultList = results
    .map((project, index) => {
      const demoStatus = project.demoUrl ? "🟢" : "🔴";
      return `${index + 1}. ${demoStatus} ${project.name}\n   📝 ${project.description}\n   🏷️  ${project.technologies.join(", ")}\n   🆔 ${project.id}`;
    })
    .join("\n\n");

  return {
    type: "success",
    content: `🔍 Search Results for '${query}':\n\n${resultList}\n\n💡 Use 'demo open <project-id>' to launch a demo`,
    timestamp: new Date(),
    id: "demo-search-results",
  };
}

/**
 * List all technologies
 * @returns {CommandOutput} The command output
 */
function listTechnologies(): CommandOutput {
  const projectService = ProjectMetadataService.getInstance();
  const technologies = projectService.getTechnologies();

  if (technologies.length === 0) {
    return {
      type: "info",
      content: "No technologies found.",
      timestamp: new Date(),
      id: "demo-no-technologies",
    };
  }

  return {
    type: "success",
    content: `🏷️  Technologies used in projects:\n\n${technologies.join(", ")}\n\n💡 Use 'demo search <technology>' to find projects using a specific technology`,
    timestamp: new Date(),
    id: "demo-technologies",
  };
}

/**
 * List all project categories
 * @returns {CommandOutput} The command output
 */
function listCategories(): CommandOutput {
  const projectService = ProjectMetadataService.getInstance();
  const categories = projectService.getCategories();

  const categoryList = categories
    .map((category) => {
      const projects = projectService.getProjectsByCategory(category);
      return `${category} (${projects.length} projects)`;
    })
    .join("\n");

  return {
    type: "success",
    content: `📂 Project Categories:\n\n${categoryList}\n\n💡 Use 'demo search <category>' to find projects in a specific category`,
    timestamp: new Date(),
    id: "demo-categories",
  };
}

/**
 * Show demo help
 * @returns {CommandOutput} The command output
 */
function showDemoHelp(): CommandOutput {
  return {
    type: "info",
    content: `🖥️  Demo Command Help

Available commands:
• demo list                    - List all available projects
• demo open <project-id>       - Open a project demo
• demo search <query>          - Search projects by name, description, or technology
• demo tech                    - List all technologies used in projects
• demo category                - List all project categories
• demo help                    - Show this help message

Examples:
• demo open portfolio-terminal
• demo search react
• demo search api

💡 Use 'demo list' to see all available projects with their IDs`,
    timestamp: new Date(),
    id: "demo-help",
  };
}
