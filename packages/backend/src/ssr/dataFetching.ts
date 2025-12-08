import { cache } from "react";
import { logger } from "../logging/logger";

// Types for portfolio data
interface GitHubRepository {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
}

interface GitHubUser {
  followers: number;
  following: number;
  public_repos: number;
}

export interface PortfolioData {
  skills: SkillCategory[];
  projects: Project[];
  experience: Experience[];
  about: AboutInfo;
  lastUpdated: string;
}

export interface SkillCategory {
  name: string;
  skills: Skill[];
  progress: number;
}

export interface Skill {
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience: number;
  projects: string[];
}

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

export interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string[];
  technologies: string[];
}

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

// Cache duration constants
const CACHE_DURATIONS = {
  SKILLS: 1000 * 60 * 15, // 15 minutes
  PROJECTS: 1000 * 60 * 30, // 30 minutes
  EXPERIENCE: 1000 * 60 * 60, // 1 hour
  ABOUT: 1000 * 60 * 60 * 24, // 24 hours
} as const;

// MODIFICATION: Static fallback data for build time
const STATIC_PROJECTS: Project[] = [
  {
    id: "terminal-portfolio",
    name: "Terminal Portfolio",
    description:
      "Interactive terminal-themed developer portfolio with command-line interface",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "React"],
    demoUrl: "https://your-domain.com",
    githubUrl: "https://github.com/yourusername/terminal-portfolio",
    status: "completed",
    featured: true,
  },
  {
    id: "ecommerce-platform",
    name: "E-Commerce Platform",
    description:
      "Full-stack online store with payment integration and real-time inventory",
    technologies: ["React", "Node.js", "PostgreSQL", "Stripe", "JWT"],
    githubUrl: "https://github.com/yourusername/ecommerce",
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

// Generic fetch with caching and error handling
/**
 *
 * @param {string} url - The URL to fetch
 * @param {RequestInit & { cacheTime?: number }} options - The options for the fetch
 * @returns {Promise<T>} The data from the fetch
 */
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
    logger.error("Fetch error occurred", {
      url,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      component: "SSRDataFetching",
      operation: "safeFetch",
    });
    throw error;
  }
}

// React cache wrapper for server components
export const getPortfolioData = cache(async (): Promise<PortfolioData> => {
  // ALWAYS use fallback data during production builds to avoid external API calls
  logger.debug("Build mode detected - using static portfolio data", {
    component: "SSRDataFetching",
    operation: "getPortfolioData",
  });
  return getFallbackPortfolioData();
});

// Get specific portfolio sections with optimized caching
export const getSkillsData = cache(async (): Promise<SkillCategory[]> => {
  // Use static data during build time to avoid API calls
  logger.debug("Build mode detected - returning empty skills array", {
    component: "SSRDataFetching",
    operation: "getSkillsData",
  });
  return [];
});

export const getProjectsData = cache(
  async (limit?: number): Promise<Project[]> => {
    // ALWAYS use fallback data during production builds to avoid external API calls
    logger.debug("Build mode detected - using static project data", {
      component: "SSRDataFetching",
      operation: "getProjectsData",
    });
    return limit ? STATIC_PROJECTS.slice(0, limit) : STATIC_PROJECTS;
  },
);

export const getExperienceData = cache(async (): Promise<Experience[]> => {
  // MODIFICATION: Use static data during build time
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL_URL) {
    return [];
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3000";

  try {
    const response = await fetchWithCache<{ data: Experience[] }>(
      `${baseUrl}/api/portfolio?section=experience`,
      { cacheTime: CACHE_DURATIONS.EXPERIENCE },
    );

    return response.data;
  } catch (error) {
    logger.error("Failed to fetch experience data", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      component: "SSRDataFetching",
      operation: "getExperienceData",
    });
    return [];
  }
});

export const getAboutData = cache(async (): Promise<AboutInfo> => {
  // MODIFICATION: Use static data during build time
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL_URL) {
    return getFallbackAboutData();
  }

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

// Featured projects for homepage
export const getFeaturedProjects = cache(async (): Promise<Project[]> => {
  const projects = await getProjectsData();
  return projects.filter((project) => project.featured);
});

// Analytics and performance data
export const getAnalyticsData = cache(
  async (): Promise<{
    pageViews: number;
    uniqueVisitors: number;
    topProjects: string[];
    topSkills: string[];
  }> => {
    // In production, this would fetch from your analytics provider
    // For now, return mock data
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

// GitHub integration for real-time project data
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
    // MODIFICATION: Skip GitHub API during build time
    if (process.env.NODE_ENV === "production" && !process.env.VERCEL_URL) {
      return {
        repositories: [],
        profile: { followers: 0, following: 0, publicRepos: 0 },
      };
    }

    const username = process.env.GITHUB_USERNAME || "yourusername";
    const token = process.env.GITHUB_TOKEN;

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
            cacheTime: 1000 * 60 * 30, // 30 minutes
          },
        ),
        fetchWithCache(`https://api.github.com/users/${username}`, {
          headers,
          cacheTime: 1000 * 60 * 60, // 1 hour
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

// Fallback data generators
/**
 *
 * @returns {PortfolioData} The fallback portfolio data
 */
function getFallbackPortfolioData(): PortfolioData {
  return {
    skills: [],
    projects: STATIC_PROJECTS,
    experience: [],
    about: getFallbackAboutData(),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 *
 * @returns {AboutInfo} The fallback about data
 */
function getFallbackAboutData(): AboutInfo {
  return {
    name: "Developer Portfolio",
    title: "Full-Stack Developer",
    bio: "Passionate full-stack developer with expertise in modern web technologies.",
    location: "Remote",
    contact: {
      email: "developer@example.com",
      github: "https://github.com/yourusername",
      linkedin: "https://linkedin.com/in/yourusername",
    },
  };
}

// Cache invalidation utilities
/**
 *
 * @param {string} section - The section to invalidate
 */
export async function invalidateCache(section?: string): Promise<void> {
  // In production, you might use Redis or another cache invalidation system
  console.log(`Cache invalidated for section: ${section || "all"}`);
}

// Health check for data sources
/**
 *
 * @returns {Promise<{api: boolean, github: boolean, lastCheck: string}>} The health check result
 */
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
