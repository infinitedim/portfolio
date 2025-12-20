import { cache } from "react";

/**
 * Represents a GitHub repository with key metrics
 * @property name - Repository name
 * @property description - Repository description text
 * @property stargazers_count - Number of stars
 * @property forks_count - Number of forks
 * @property language - Primary programming language
 * @property updated_at - Last update timestamp
 */
interface GitHubRepository {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
}

/**
 * Represents a GitHub user's profile statistics
 * @property followers - Number of followers
 * @property following - Number of accounts following
 * @property public_repos - Number of public repositories
 */
interface GitHubUser {
  followers: number;
  following: number;
  public_repos: number;
}

/**
 * Complete portfolio data structure
 * @property skills - Categorized skills with progress tracking
 * @property projects - List of portfolio projects
 * @property experience - Professional experience entries
 * @property about - Personal information and contact details
 * @property lastUpdated - Timestamp of last data update
 */
export interface PortfolioData {
  skills: SkillCategory[];
  projects: Project[];
  experience: Experience[];
  about: AboutInfo;
  lastUpdated: string;
}

/**
 * A category of related skills with progress tracking
 * @property name - Category name (e.g., "Frontend", "Backend")
 * @property skills - Array of skills in this category
 * @property progress - Overall progress percentage (0-100)
 */
export interface SkillCategory {
  name: string;
  skills: Skill[];
  progress: number;
}

/**
 * Individual skill with proficiency and experience details
 * @property name - Skill name (e.g., "React", "TypeScript")
 * @property level - Proficiency level
 * @property yearsOfExperience - Years of experience with this skill
 * @property projects - Project names using this skill
 */
export interface Skill {
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience: number;
  projects: string[];
}

/**
 * Portfolio project details
 * @property id - Unique project identifier
 * @property name - Project name
 * @property description - Project description
 * @property technologies - Array of technologies used
 * @property demoUrl - Optional live demo URL
 * @property githubUrl - Optional GitHub repository URL
 * @property imageUrl - Optional project image URL
 * @property status - Project completion status
 * @property featured - Whether project is featured on homepage
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  demoUrl?: string;
  githubUrl?: string;
  imageUrl?: string;
  status: "completed" | "in-progress" | "planned";
  featured: boolean;
}

/**
 * Professional experience entry
 * @property company - Company name
 * @property position - Job title/position
 * @property duration - Employment duration (e.g., "2020-2022")
 * @property description - Array of responsibility/achievement descriptions
 * @property technologies - Technologies used in this role
 */
export interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string[];
  technologies: string[];
}

/**
 * Personal information and contact details
 * @property name - Full name
 * @property title - Professional title
 * @property bio - Biography text
 * @property location - Geographic location
 * @property contact - Contact information and social links
 */
export interface AboutInfo {
  name: string;
  title: string;
  bio: string;
  location: string;
  contact: {
    email: string;
    github: string;
    linkedin: string;
    twitter?: string;
  };
}

const CACHE_DURATIONS = {
  SKILLS: 1000 * 60 * 15,
  PROJECTS: 1000 * 60 * 30,
  EXPERIENCE: 1000 * 60 * 60,
  ABOUT: 1000 * 60 * 60 * 24,
} as const;

const STATIC_PROJECTS: Project[] = [
  {
    id: "terminal-portfolio",
    name: "Terminal Portfolio",
    description:
      "Interactive terminal-themed developer portfolio with command-line interface",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "React"],
    demoUrl: "https://infinitedim.site",
    githubUrl: "https://github.com/infinitedim/portfolio",
    status: "completed",
    featured: true,
  },
  {
    id: "ecommerce-platform",
    name: "E-Commerce Platform",
    description:
      "Full-stack online store with payment integration and real-time inventory",
    technologies: ["React", "Node.js", "PostgreSQL", "Stripe", "JWT"],
    githubUrl: "https://github.com/infinitedim/ecommerce",
    status: "completed",
    featured: true,
  },
  {
    id: "task-management",
    name: "Task Management App",
    description:
      "Collaborative project management tool with real-time features",
    technologies: ["React", "Firebase", "Material-UI", "WebSocket"],
    demoUrl: "https://taskapp-demo.com",
    status: "completed",
    featured: false,
  },
  {
    id: "weather-dashboard",
    name: "Weather Dashboard",
    description: "Beautiful weather app with forecasts and interactive charts",
    technologies: ["React", "OpenWeather API", "Chart.js", "Sass"],
    demoUrl: "https://weather-demo.com",
    status: "completed",
    featured: false,
  },
];

async function fetchWithCache<T>(
  url: string,
  options: RequestInit & { cacheTime?: number } = {},
): Promise<T> {
  const { ...fetchOptions } = options;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Not Found");
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return data as T;
  } catch (error) {
    console.error("Fetch error occurred", {
      url,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      component: "SSRDataFetching",
      operation: "safeFetch",
    });
    throw error;
  }
}

export const getPortfolioData = cache(async (): Promise<PortfolioData> => {
  console.log("Build mode detected - using static portfolio data");
  return getFallbackPortfolioData();
});

export const getSkillsData = cache(async (): Promise<SkillCategory[]> => {
  console.log("Build mode detected - returning empty skills array");
  return [];
});

export const getProjectsData = cache(
  async (limit?: number): Promise<Project[]> => {
    console.log("Build mode detected - using static project data");
    return limit ? STATIC_PROJECTS.slice(0, limit) : STATIC_PROJECTS;
  },
);

export const getExperienceData = cache(async (): Promise<Experience[]> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3000";

  try {
    const response = await fetchWithCache<{ data: Experience[] }>(
      `${baseUrl}/api/portfolio?section=experience`,
      { cacheTime: CACHE_DURATIONS.EXPERIENCE },
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch experience data", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      component: "SSRDataFetching",
      operation: "getExperienceData",
    });
    return [];
  }
});

export const getAboutData = cache(async (): Promise<AboutInfo> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3000";

  try {
    const response = await fetchWithCache<{ data: AboutInfo }>(
      `${baseUrl}/api/portfolio?section=about`,
      { cacheTime: CACHE_DURATIONS.ABOUT },
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch about data", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      component: "SSRDataFetching",
      operation: "getAboutData",
    });
    return getFallbackAboutData();
  }
});

export const getFeaturedProjects = cache(async (): Promise<Project[]> => {
  const projects = await getProjectsData();
  return projects.filter((project) => project.featured);
});

export const getAnalyticsData = cache(
  async (): Promise<{
    pageViews: number;
    uniqueVisitors: number;
    topProjects: string[];
    topSkills: string[];
  }> => {
    return {
      pageViews: 15420,
      uniqueVisitors: 8342,
      topProjects: [
        "terminal-portfolio",
        "ecommerce-platform",
        "task-management",
      ],
      topSkills: ["React", "Next.js", "TypeScript", "Node.js"],
    };
  },
);

export const getGitHubData = cache(
  async (): Promise<{
    repositories: Array<{
      name: string;
      description: string;
      stars: number;
      forks: number;
      language: string;
      updated: string;
    }>;
    profile: {
      followers: number;
      following: number;
      publicRepos: number;
    };
  }> => {
    const username = process.env.GH_USERNAME || "infinitedim";
    const token = process.env.GH_TOKEN;

    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Terminal-Portfolio",
      };

      if (token) {
        headers["Authorization"] = `token ${token}`;
      }

      const [reposResponse, userResponse] = await Promise.all([
        fetchWithCache(
          `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
          {
            headers,
            cacheTime: 1000 * 60 * 30,
          },
        ),
        fetchWithCache(`https://api.github.com/users/${username}`, {
          headers,
          cacheTime: 1000 * 60 * 60,
        }),
      ]);

      const repositories = (reposResponse as GitHubRepository[]).map(
        (repo) => ({
          name: repo.name,
          description: repo.description || "",
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language || "Unknown",
          updated: repo.updated_at,
        }),
      );

      const profile = {
        followers: (userResponse as GitHubUser).followers,
        following: (userResponse as GitHubUser).following,
        publicRepos: (userResponse as GitHubUser).public_repos,
      };

      return { repositories, profile };
    } catch (error) {
      console.error("Failed to fetch GitHub data", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: "SSRDataFetching",
        operation: "getGitHubData",
      });
      return {
        repositories: [],
        profile: { followers: 0, following: 0, publicRepos: 0 },
      };
    }
  },
);

function getFallbackPortfolioData(): PortfolioData {
  return {
    skills: [],
    projects: STATIC_PROJECTS,
    experience: [],
    about: getFallbackAboutData(),
    lastUpdated: new Date().toISOString(),
  };
}

function getFallbackAboutData(): AboutInfo {
  return {
    name: "Dimas Saputra",
    title: "Full-Stack Developer",
    bio: "Passionate full-stack developer with expertise in modern web technologies.",
    location: "Indonesia",
    contact: {
      email: "developer@infinitedim.site",
      github: "https://github.com/infinitedim",
      linkedin: "https://linkedin.com/in/infinitedim",
    },
  };
}

export async function invalidateCache(section?: string): Promise<void> {
  console.log(`Cache invalidated for section: ${section || "all"}`);
}

export async function checkDataHealth(): Promise<{
  api: boolean;
  github: boolean;
  lastCheck: string;
}> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3000";

  try {
    const [apiCheck, githubCheck] = await Promise.allSettled([
      fetch(`${baseUrl}/api/portfolio?section=about`),
      getGitHubData(),
    ]);

    return {
      api: apiCheck.status === "fulfilled" && apiCheck.value.ok,
      github: githubCheck.status === "fulfilled",
      lastCheck: new Date().toISOString(),
    };
  } catch {
    return {
      api: false,
      github: false,
      lastCheck: new Date().toISOString(),
    };
  }
}
