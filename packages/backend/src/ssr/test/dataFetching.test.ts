import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock react cache to return the function directly
vi.mock("react", () => ({
  cache: (fn: unknown) => fn,
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, "log").mockImplementation(() => {}),
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
};

describe("dataFetching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getSkillsData", () => {
    it("should return empty array for skills", async () => {
      const { getSkillsData } = await import("../dataFetching");
      const result = await getSkillsData();

      expect(result).toEqual([]);
    });

    it("should log build mode message", async () => {
      const { getSkillsData } = await import("../dataFetching");
      await getSkillsData();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "Build mode detected - returning empty skills array",
      );
    });
  });

  describe("getProjectsData", () => {
    it("should return all static projects when no limit specified", async () => {
      const { getProjectsData } = await import("../dataFetching");
      const result = await getProjectsData();

      expect(result).toHaveLength(4);
    });

    it("should return limited projects when limit is specified", async () => {
      const { getProjectsData } = await import("../dataFetching");
      const result = await getProjectsData(2);

      expect(result).toHaveLength(2);
    });

    it("should return projects with correct structure", async () => {
      const { getProjectsData } = await import("../dataFetching");
      const result = await getProjectsData(1);
      const project = result[0]!;

      expect(project).toHaveProperty("id");
      expect(project).toHaveProperty("name");
      expect(project).toHaveProperty("description");
      expect(project).toHaveProperty("technologies");
      expect(project).toHaveProperty("status");
      expect(project).toHaveProperty("featured");
    });

    it("should include terminal-portfolio as first project", async () => {
      const { getProjectsData } = await import("../dataFetching");
      const result = await getProjectsData();

      expect(result[0]!.id).toBe("terminal-portfolio");
      expect(result[0]!.name).toBe("Terminal Portfolio");
    });

    it("should log build mode message", async () => {
      const { getProjectsData } = await import("../dataFetching");
      await getProjectsData();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "Build mode detected - using static project data",
      );
    });
  });

  describe("getExperienceData", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should return empty array in production without VERCEL_URL", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.VERCEL_URL;

      const { getExperienceData } = await import("../dataFetching");
      const result = await getExperienceData();

      expect(result).toEqual([]);
    });

    it("should fetch experience data when not in production build", async () => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

      const mockExperience = [
        {
          company: "Test Company",
          position: "Developer",
          duration: "2020-2023",
          description: ["Built stuff"],
          technologies: ["React"],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockExperience }),
      });

      const { getExperienceData } = await import("../dataFetching");
      const result = await getExperienceData();

      expect(result).toEqual(mockExperience);
    });

    it("should return empty array on fetch error", async () => {
      process.env.NODE_ENV = "development";

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { getExperienceData } = await import("../dataFetching");
      const result = await getExperienceData();

      expect(result).toEqual([]);
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe("getAboutData", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should return fallback data in production without VERCEL_URL", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.VERCEL_URL;

      const { getAboutData } = await import("../dataFetching");
      const result = await getAboutData();

      expect(result.name).toBe("Developer Portfolio");
      expect(result.title).toBe("Full-Stack Developer");
    });

    it("should fetch about data when not in production build", async () => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

      const mockAbout = {
        name: "John Doe",
        title: "Senior Developer",
        bio: "Test bio",
        location: "NYC",
        contact: {
          email: "john@example.com",
          github: "https://github.com/john",
          linkedin: "https://linkedin.com/in/john",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockAbout }),
      });

      const { getAboutData } = await import("../dataFetching");
      const result = await getAboutData();

      expect(result).toEqual(mockAbout);
    });

    it("should return fallback data on fetch error", async () => {
      process.env.NODE_ENV = "development";

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { getAboutData } = await import("../dataFetching");
      const result = await getAboutData();

      expect(result.name).toBe("Developer Portfolio");
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe("getFeaturedProjects", () => {
    it("should return only featured projects", async () => {
      const { getFeaturedProjects } = await import("../dataFetching");
      const result = await getFeaturedProjects();

      expect(result.length).toBeGreaterThan(0);
      result.forEach((project) => {
        expect(project.featured).toBe(true);
      });
    });

    it("should include terminal-portfolio and ecommerce-platform", async () => {
      const { getFeaturedProjects } = await import("../dataFetching");
      const result = await getFeaturedProjects();
      const projectIds = result.map((p) => p.id);

      expect(projectIds).toContain("terminal-portfolio");
      expect(projectIds).toContain("ecommerce-platform");
    });
  });

  describe("getAnalyticsData", () => {
    it("should return mock analytics data", async () => {
      const { getAnalyticsData } = await import("../dataFetching");
      const result = await getAnalyticsData();

      expect(result.pageViews).toBe(15420);
      expect(result.uniqueVisitors).toBe(8342);
      expect(result.topProjects).toHaveLength(3);
      expect(result.topSkills).toHaveLength(4);
    });

    it("should include expected top projects", async () => {
      const { getAnalyticsData } = await import("../dataFetching");
      const result = await getAnalyticsData();

      expect(result.topProjects).toContain("terminal-portfolio");
      expect(result.topProjects).toContain("ecommerce-platform");
    });

    it("should include expected top skills", async () => {
      const { getAnalyticsData } = await import("../dataFetching");
      const result = await getAnalyticsData();

      expect(result.topSkills).toContain("React");
      expect(result.topSkills).toContain("TypeScript");
    });
  });

  describe("getGitHubData", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should return empty data in production without VERCEL_URL", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.VERCEL_URL;

      const { getGitHubData } = await import("../dataFetching");
      const result = await getGitHubData();

      expect(result.repositories).toEqual([]);
      expect(result.profile).toEqual({
        followers: 0,
        following: 0,
        publicRepos: 0,
      });
    });

    it("should fetch GitHub data when not in production build", async () => {
      process.env.NODE_ENV = "development";
      process.env.GITHUB_USERNAME = "testuser";

      const mockRepos = [
        {
          name: "test-repo",
          description: "A test repo",
          stargazers_count: 10,
          forks_count: 5,
          language: "TypeScript",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const mockUser = {
        followers: 100,
        following: 50,
        public_repos: 30,
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRepos),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUser),
        });

      const { getGitHubData } = await import("../dataFetching");
      const result = await getGitHubData();

      expect(result.repositories).toHaveLength(1);
      expect(result.repositories[0]!.name).toBe("test-repo");
      expect(result.profile.followers).toBe(100);
    });

    it("should include auth header when GITHUB_TOKEN is set", async () => {
      process.env.NODE_ENV = "development";
      process.env.GITHUB_USERNAME = "testuser";
      process.env.GITHUB_TOKEN = "test-token";

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ followers: 0, following: 0, public_repos: 0 }),
        });

      const { getGitHubData } = await import("../dataFetching");
      await getGitHubData();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "token test-token",
          }),
        }),
      );
    });

    it("should return empty data on fetch error", async () => {
      process.env.NODE_ENV = "development";

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { getGitHubData } = await import("../dataFetching");
      const result = await getGitHubData();

      expect(result.repositories).toEqual([]);
      expect(result.profile).toEqual({
        followers: 0,
        following: 0,
        publicRepos: 0,
      });
    });
  });

  describe("invalidateCache", () => {
    it("should log cache invalidation for specific section", async () => {
      const { invalidateCache } = await import("../dataFetching");
      await invalidateCache("skills");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "Cache invalidated for section: skills",
      );
    });

    it("should log cache invalidation for all sections when no section specified", async () => {
      const { invalidateCache } = await import("../dataFetching");
      await invalidateCache();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "Cache invalidated for section: all",
      );
    });
  });

  describe("Static Project Data Validation", () => {
    it("should have valid project statuses", async () => {
      const { getProjectsData } = await import("../dataFetching");
      const projects = await getProjectsData();
      const validStatuses = ["completed", "in-progress", "planned"];

      projects.forEach((project) => {
        expect(validStatuses).toContain(project.status);
      });
    });

    it("should have non-empty technologies array for each project", async () => {
      const { getProjectsData } = await import("../dataFetching");
      const projects = await getProjectsData();

      projects.forEach((project) => {
        expect(project.technologies.length).toBeGreaterThan(0);
      });
    });

    it("should have unique project IDs", async () => {
      const { getProjectsData } = await import("../dataFetching");
      const projects = await getProjectsData();
      const ids = projects.map((p) => p.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("Fallback About Data Validation", () => {
    it("should have valid contact information structure", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.VERCEL_URL;

      const { getAboutData } = await import("../dataFetching");
      const result = await getAboutData();

      expect(result.contact).toHaveProperty("email");
      expect(result.contact).toHaveProperty("github");
      expect(result.contact).toHaveProperty("linkedin");
    });

    it("should have valid GitHub URL format", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.VERCEL_URL;

      const { getAboutData } = await import("../dataFetching");
      const result = await getAboutData();

      expect(result.contact.github).toMatch(/^https:\/\/github\.com\//);
    });

    it("should have valid LinkedIn URL format", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.VERCEL_URL;

      const { getAboutData } = await import("../dataFetching");
      const result = await getAboutData();

      expect(result.contact.linkedin).toMatch(/^https:\/\/linkedin\.com\/in\//);
    });
  });
});
