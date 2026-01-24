/**
 * Metadata for a portfolio project
 * @property id - Unique project identifier
 * @property name - Project name/title
 * @property description - Detailed project description
 * @property demoUrl - Optional live demo URL
 * @property githubUrl - Optional GitHub repository URL
 * @property liveUrl - Optional production URL
 * @property technologies - Array of technologies/frameworks used
 * @property category - Project classification
 * @property featured - Whether to feature on homepage
 * @property createdAt - Project creation date (ISO string)
 * @property updatedAt - Last update date (ISO string)
 * @property image - Optional project image path
 * @property tags - Array of descriptive tags
 */
export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  demoUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
  technologies: string[];
  category: ProjectCategory;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  image?: string;
  tags: string[];
}

/**
 * Categories for classifying projects
 * @typedef {string} ProjectCategory
 */
export type ProjectCategory =
  | "web-app"
  | "mobile-app"
  | "desktop-app"
  | "api"
  | "library"
  | "tool"
  | "game"
  | "other";

/**
 * Human-readable labels for project categories
 * Maps category keys to display names
 */
export const PROJECT_CATEGORIES: Record<ProjectCategory, string> = {
  "web-app": "Web Application",
  "mobile-app": "Mobile Application",
  "desktop-app": "Desktop Application",
  api: "API/Backend",
  library: "Library/Package",
  tool: "Development Tool",
  game: "Game",
  other: "Other",
};

export const SAMPLE_PROJECTS: ProjectMetadata[] = [
  {
    id: "portfolio-terminal",
    name: "Terminal Portfolio",
    description:
      "Interactive terminal-style portfolio built with Next.js and React",
    demoUrl: "https://infinitedim.site",
    githubUrl: "https://github.com/infinitedim/portfolio",
    liveUrl: "https://infinitedim.site",
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Node.js"],
    category: "web-app",
    featured: true,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
    image: "/images/portfolio-terminal.png",
    tags: ["portfolio", "terminal", "interactive", "fullstack"],
  },
];

/**
 * Service for managing and querying project metadata
 * Provides methods to retrieve, filter, and search projects
 * Implements singleton pattern for consistent state
 * @example
 * ```ts
 * const service = ProjectMetadataService.getInstance();
 * const featured = service.getFeaturedProjects();
 * ```
 */
export class ProjectMetadataService {
  private static instance: ProjectMetadataService;
  private projects: ProjectMetadata[] = SAMPLE_PROJECTS;

  private constructor() {}

  /**
   * Gets the singleton instance of ProjectMetadataService
   * @returns The singleton service instance
   */
  static getInstance(): ProjectMetadataService {
    if (!ProjectMetadataService.instance) {
      ProjectMetadataService.instance = new ProjectMetadataService();
    }
    return ProjectMetadataService.instance;
  }

  /**
   * Retrieves all projects
   * @returns Array of all project metadata
   */
  getAllProjects(): ProjectMetadata[] {
    return [...this.projects];
  }

  /**
   * Finds a project by its unique identifier
   * @param id - Project ID to search for
   * @returns Project metadata if found, undefined otherwise
   */
  getProjectById(id: string): ProjectMetadata | undefined {
    return this.projects.find((project) => project.id === id);
  }

  /**
   * Retrieves all featured projects
   * @returns Array of featured project metadata
   */
  getFeaturedProjects(): ProjectMetadata[] {
    return this.projects.filter((project) => project.featured);
  }

  /**
   * Filters projects by category
   * @param category - Category to filter by
   * @returns Array of projects in the specified category
   */
  getProjectsByCategory(category: ProjectCategory): ProjectMetadata[] {
    return this.projects.filter((project) => project.category === category);
  }

  /**
   * Filters projects by technology/framework
   * @param technology - Technology name to search for (case-insensitive)
   * @returns Array of projects using the specified technology
   */
  getProjectsByTechnology(technology: string): ProjectMetadata[] {
    const tech = technology.toLowerCase();
    return this.projects.filter((project) =>
      project.technologies.some((t) => t.toLowerCase().includes(tech)),
    );
  }

  /**
   * Searches projects by name, description, technologies, or tags
   * @param query - Search query string (case-insensitive)
   * @returns Array of matching projects
   */
  searchProjects(query: string): ProjectMetadata[] {
    const searchTerm = query.toLowerCase();
    return this.projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchTerm) ||
        project.description.toLowerCase().includes(searchTerm) ||
        project.technologies.some((tech) =>
          tech.toLowerCase().includes(searchTerm),
        ) ||
        project.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
    );
  }

  /**
   * Gets a sorted list of all unique technologies used across projects
   * @returns Sorted array of technology names
   */
  getTechnologies(): string[] {
    const techSet = new Set<string>();
    this.projects.forEach((project) => {
      project.technologies.forEach((tech) => techSet.add(tech));
    });
    return Array.from(techSet).sort();
  }

  /**
   * Gets all available project categories
   * @returns Array of project category keys
   */
  getCategories(): ProjectCategory[] {
    return Object.keys(PROJECT_CATEGORIES) as ProjectCategory[];
  }

  addProject(
    project: Omit<ProjectMetadata, "id" | "createdAt" | "updatedAt">,
  ): ProjectMetadata {
    const newProject: ProjectMetadata = {
      ...project,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.push(newProject);
    return newProject;
  }

  updateProject(
    id: string,
    updates: Partial<ProjectMetadata>,
  ): ProjectMetadata | null {
    const index = this.projects.findIndex((project) => project.id === id);
    if (index === -1) return null;

    this.projects[index] = {
      ...this.projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.projects[index];
  }

  deleteProject(id: string): boolean {
    const index = this.projects.findIndex((project) => project.id === id);
    if (index === -1) return false;

    this.projects.splice(index, 1);
    return true;
  }

  private generateId(): string {
    return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
