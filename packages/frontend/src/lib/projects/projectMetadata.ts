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

export type ProjectCategory =
  | "web-app"
  | "mobile-app"
  | "desktop-app"
  | "api"
  | "library"
  | "tool"
  | "game"
  | "other";

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
    demoUrl: "https://your-portfolio.vercel.app",
    githubUrl: "https://github.com/yourusername/portfolio",
    liveUrl: "https://your-portfolio.vercel.app",
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Node.js"],
    category: "web-app",
    featured: true,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
    image: "/images/portfolio-terminal.png",
    tags: ["portfolio", "terminal", "interactive", "fullstack"],
  },
];

export class ProjectMetadataService {
  private static instance: ProjectMetadataService;
  private projects: ProjectMetadata[] = SAMPLE_PROJECTS;

  private constructor() {}

  static getInstance(): ProjectMetadataService {
    if (!ProjectMetadataService.instance) {
      ProjectMetadataService.instance = new ProjectMetadataService();
    }
    return ProjectMetadataService.instance;
  }

  getAllProjects(): ProjectMetadata[] {
    return [...this.projects];
  }

  getProjectById(id: string): ProjectMetadata | undefined {
    return this.projects.find((project) => project.id === id);
  }

  getFeaturedProjects(): ProjectMetadata[] {
    return this.projects.filter((project) => project.featured);
  }

  getProjectsByCategory(category: ProjectCategory): ProjectMetadata[] {
    return this.projects.filter((project) => project.category === category);
  }

  getProjectsByTechnology(technology: string): ProjectMetadata[] {
    const tech = technology.toLowerCase();
    return this.projects.filter((project) =>
      project.technologies.some((t) => t.toLowerCase().includes(tech)),
    );
  }

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

  getTechnologies(): string[] {
    const techSet = new Set<string>();
    this.projects.forEach((project) => {
      project.technologies.forEach((tech) => techSet.add(tech));
    });
    return Array.from(techSet).sort();
  }

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
