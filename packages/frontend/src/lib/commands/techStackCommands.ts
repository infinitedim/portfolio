import { ProjectMetadataService } from "@/lib/projects/projectMetadata";
import type {
  Command,
  CommandOutput,
} from "@/types/terminal";

export const techStackCommand: Command = {
  name: "tech-stack",
  description: "Technology stack visualization and analysis",
  aliases: ["tech", "stack", "technologies"],
  async execute(args: string[]): Promise<CommandOutput> {
    const [action, ...params] = args;

    switch (action) {
      case "list":
        return listTechnologies();
      case "projects":
        return getProjectsByTech(params[0]);
      case "stats":
        return getTechStats();
      case "categories":
        return categorizeTechnologies();
      case "search":
        return searchTechnologies(params.join(" "));
      case "help":
        return showTechStackHelp();
      default:
        if (!action) {
          return listTechnologies();
        }
        return {
          type: "error",
          content: `Unknown tech-stack action: ${action}. Use 'tech-stack help' for available commands.`,
          timestamp: new Date(),
          id: "tech-stack-unknown-action",
        };
    }
  },
};

/**
 * List all technologies
 * @returns {CommandOutput} The command output
 */
function listTechnologies(): CommandOutput {
  const projectService = ProjectMetadataService.getInstance();
  const technologies = projectService.getTechnologies();

  // Ensure technologies is an array
  if (!Array.isArray(technologies)) {
    console.error(
      "Technologies is not an array in listTechnologies:",
      technologies,
    );
    return {
      type: "error",
      content: "Error: Unable to retrieve technologies data.",
      timestamp: new Date(),
      id: "tech-stack-technologies-error",
    };
  }

  if (technologies.length === 0) {
    return {
      type: "info",
      content: "No technologies found.",
      timestamp: new Date(),
      id: "tech-stack-no-technologies",
    };
  }

  const categorized = categorizeTechnologiesData();
  const techList = Object.entries(categorized)
    .map(([category, techs]) => {
      const techItems = techs.map((tech) => `  • ${tech}`).join("\n");
      return `📂 ${category}:\n${techItems}`;
    })
    .join("\n\n");

  return {
    type: "success",
    content: `🏷️  Technology Stack:\n\n${techList}\n\n💡 Use 'tech-stack projects <technology>' to see projects using a specific technology`,
    timestamp: new Date(),
    id: "tech-stack-list",
  };
}

/**
 * Get projects by technology
 * @param {string} technology - The technology to search for
 * @returns {CommandOutput} The command output
 */
function getProjectsByTech(technology: string): CommandOutput {
  if (!technology) {
    return {
      type: "error",
      content:
        "Please provide a technology. Usage: tech-stack projects <technology>",
      timestamp: new Date(),
      id: "tech-stack-no-tech",
    };
  }

  const projectService = ProjectMetadataService.getInstance();
  const projects = projectService.getProjectsByTechnology(technology);

  // Ensure projects is an array
  if (!Array.isArray(projects)) {
    console.error("Projects is not an array in getProjectsByTech:", projects);
    return {
      type: "error",
      content: "Error: Unable to retrieve projects data.",
      timestamp: new Date(),
      id: "tech-stack-projects-error",
    };
  }

  if (projects.length === 0) {
    return {
      type: "info",
      content: `No projects found using '${technology}'.`,
      timestamp: new Date(),
      id: "tech-stack-no-projects",
    };
  }

  const projectList = projects
    .map((project) => {
      const featured = project.featured ? "⭐" : "";
      return `📦 ${project.name} ${featured}\n   📝 ${project.description}\n   🏷️  ${project.technologies.join(", ")}`;
    })
    .join("\n\n");

  return {
    type: "success",
    content: `📦 Projects using ${technology}:\n\n${projectList}`,
    timestamp: new Date(),
    id: "tech-stack-projects",
  };
}

/**
 * Get technology statistics
 * @returns {CommandOutput} The command output
 */
function getTechStats(): CommandOutput {
  const projectService = ProjectMetadataService.getInstance();
  const technologies = projectService.getTechnologies();
  const projects = projectService.getAllProjects();

  // Ensure technologies is an array
  if (!Array.isArray(technologies)) {
    console.error(
      "Technologies is not an array in getTechStats:",
      technologies,
    );
    return {
      type: "error",
      content: "Error: Unable to retrieve technologies data.",
      timestamp: new Date(),
      id: "tech-stack-stats-error",
    };
  }

  // Ensure projects is an array
  if (!Array.isArray(projects)) {
    console.error("Projects is not an array in getTechStats:", projects);
    return {
      type: "error",
      content: "Error: Unable to retrieve projects data.",
      timestamp: new Date(),
      id: "tech-stack-stats-projects-error",
    };
  }

  const techUsage: Record<string, number> = {};
  technologies.forEach((tech) => {
    techUsage[tech] = projectService.getProjectsByTechnology(tech).length;
  });

  const sortedTechs = Object.entries(techUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10); // Top 10 most used technologies

  const statsList = sortedTechs
    .map(([tech, count]) => {
      const percentage = ((count / projects.length) * 100).toFixed(1);
      return `🏷️  ${tech}: ${count} projects (${percentage}%)`;
    })
    .join("\n");

  return {
    type: "success",
    content: `📊 Technology Statistics (Top 10):\n\n${statsList}\n\n📈 Total projects: ${projects.length}\n🏷️  Total technologies: ${technologies.length}`,
    timestamp: new Date(),
    id: "tech-stack-stats",
  };
}

/**
 * Categorize technologies data (internal function)
 * @returns {Record<string, string[]>} The categorized technologies
 */
function categorizeTechnologiesData(): Record<string, string[]> {
  const projectService = ProjectMetadataService.getInstance();
  const technologies = projectService.getTechnologies();

  // Ensure technologies is an array
  if (!Array.isArray(technologies)) {
    console.error("Technologies is not an array:", technologies);
    return {};
  }

  const categories = {
    Frontend: [
      "React",
      "Vue",
      "Angular",
      "Svelte",
      "TypeScript",
      "JavaScript",
      "HTML",
      "CSS",
      "Tailwind",
      "Bootstrap",
    ],
    Backend: [
      "Node.js",
      "Python",
      "Java",
      "C#",
      "PHP",
      "Go",
      "Rust",
      "Express",
      "Django",
      "Spring",
    ],
    Database: ["MongoDB", "PostgreSQL", "MySQL", "SQLite", "Redis", "Firebase"],
    DevOps: ["Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "CI/CD"],
    Mobile: ["React Native", "Flutter", "Swift", "Kotlin", "Ionic"],
    Tools: ["Webpack", "Vite", "Babel", "ESLint", "Prettier", "Vitest"],
  };

  const categorized: Record<string, string[]> = {};
  Object.entries(categories).forEach(([category, techs]) => {
    // Ensure techs is an array
    if (!Array.isArray(techs)) {
      console.error(`Techs for category ${category} is not an array:`, techs);
      return;
    }

    const matchingTechs = technologies.filter((tech) =>
      techs.some((catTech) =>
        tech.toLowerCase().includes(catTech.toLowerCase()),
      ),
    );
    if (matchingTechs.length > 0) {
      categorized[category] = matchingTechs;
    }
  });

  return categorized;
}

/**
 * Categorize technologies
 * @returns {CommandOutput} The command output
 */
function categorizeTechnologies(): CommandOutput {
  const categorized = categorizeTechnologiesData();

  const categoryList = Object.entries(categorized)
    .map(
      ([category, techs]) =>
        `${category} (${techs.length}): ${techs.join(", ")}`,
    )
    .join("\n");

  return {
    type: "success",
    content: `📂 Technology Categories:\n\n${categoryList}`,
    timestamp: new Date(),
    id: "tech-stack-categories",
  };
}

/**
 * Search technologies
 * @param {string} query - The search query
 * @returns {CommandOutput} The command output
 */
function searchTechnologies(query: string): CommandOutput {
  if (!query) {
    return {
      type: "error",
      content:
        "Please provide a search query. Usage: tech-stack search <query>",
      timestamp: new Date(),
      id: "tech-stack-no-search-query",
    };
  }

  const projectService = ProjectMetadataService.getInstance();
  const technologies = projectService.getTechnologies();

  // Ensure technologies is an array
  if (!Array.isArray(technologies)) {
    console.error(
      "Technologies is not an array in searchTechnologies:",
      technologies,
    );
    return {
      type: "error",
      content: "Error: Unable to retrieve technologies data.",
      timestamp: new Date(),
      id: "tech-stack-search-error",
    };
  }

  const matchingTechs = technologies.filter((tech) =>
    tech.toLowerCase().includes(query.toLowerCase()),
  );

  if (matchingTechs.length === 0) {
    return {
      type: "info",
      content: `No technologies found matching '${query}'.`,
      timestamp: new Date(),
      id: "tech-stack-search-no-results",
    };
  }

  const techList = matchingTechs
    .map((tech) => {
      const projectCount = projectService.getProjectsByTechnology(tech).length;
      return `🏷️  ${tech} (${projectCount} projects)`;
    })
    .join("\n");

  return {
    type: "success",
    content: `🔍 Technologies matching '${query}':\n\n${techList}`,
    timestamp: new Date(),
    id: "tech-stack-search-results",
  };
}

/**
 * Show tech-stack help
 * @returns {CommandOutput} The command output
 */
function showTechStackHelp(): CommandOutput {
  return {
    type: "info",
    content: `🏷️  Tech Stack Command Help

Available commands:
  tech-stack list                   - List all technologies by category
  tech-stack projects <tech>        - Show projects using a technology
  tech-stack stats                  - Show technology usage statistics
  tech-stack categories             - Show technology categories
  tech-stack search <query>         - Search for technologies
  tech-stack help                   - Show this help

Examples:
  tech-stack projects React
  tech-stack search TypeScript
  tech-stack stats`,
    timestamp: new Date(),
    id: "tech-stack-help",
  };
}
