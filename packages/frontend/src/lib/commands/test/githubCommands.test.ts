import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/github/githubService", () => {
  const mock = {
    getInstance: () => ({
      getUser: async (u: string) => ({
        login: u,
        id: 1,
        avatar_url: "",
        name: "D",
        bio: null,
        public_repos: 10,
        followers: 100,
        following: 50,
        created_at: "",
        updated_at: "",
      }),
      getUserRepos: async () => [
        {
          name: "r1",
          html_url: "https://github.com/user/r1",
          language: "TypeScript",
          stargazers_count: 50,
          forks_count: 10,
          description: "A test repository",
        },
        {
          name: "r2",
          html_url: "https://github.com/user/r2",
          language: "JavaScript",
          stargazers_count: 25,
          forks_count: 5,
          description: null,
        },
      ],
      getRepo: async (user: string, repo: string) => ({
        full_name: `${user}/${repo}`,
        description: "Test repo description",
        language: "TypeScript",
        stargazers_count: 100,
        forks_count: 20,
        watchers_count: 80,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        html_url: `https://github.com/${user}/${repo}`,
      }),
      getRepoCommits: async () => [
        {
          commit: {
            message: "Initial commit",
            author: { name: "Author", date: "2024-01-01T00:00:00Z" },
          },
        },
      ],
      getRepoLanguages: async () => ({ TypeScript: 8000, JavaScript: 2000 }),
      searchRepos: async (q: string) => ({
        total_count: 1,
        items: [
          {
            full_name: "user/searched-repo",
            description: "Found repo",
            language: "TypeScript",
            stargazers_count: 100,
            html_url: "https://github.com/user/searched-repo",
          },
        ],
      }),
      getUserStarredRepos: async () => [
        {
          full_name: "other/starred-repo",
          description: "A starred repo",
          language: "Python",
          stargazers_count: 500,
          html_url: "https://github.com/other/starred-repo",
        },
      ],
      getUserGists: async () => [
        {
          description: "Test gist",
          html_url: "https://gist.github.com/test",
          files: { "test.js": {} },
          created_at: "2024-01-01T00:00:00Z",
        },
      ],
      clearCache: vi.fn(),
      getCacheStats: () => ({ size: 5, entries: ["entry1", "entry2"] }),
    }),
  };
  return { GitHubService: mock };
});

import { githubCommand } from "../githubCommands";

describe("githubCommand", () => {
  describe("user action", () => {
    it("returns error when no username provided", async () => {
      const out = await githubCommand.execute(["user"] as any);
      expect(out.type).toBe("error");
      expect(out.content).toContain("provide a username");
    });

    it("returns user info when username provided", async () => {
      const out = await githubCommand.execute(["user", "infinitedim"] as any);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("GitHub User");
      expect(out.content as string).toContain("infinitedim");
    });
  });

  describe("repos action", () => {
    it("returns error when no username provided", async () => {
      const out = await githubCommand.execute(["repos"] as any);
      expect(out.type).toBe("error");
      expect(out.content).toContain("provide a username");
    });

    it("returns repository list when username provided", async () => {
      const out = await githubCommand.execute(["repos", "testuser"] as any);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Repositories");
      expect(out.content as string).toContain("r1");
      expect(out.content as string).toContain("TypeScript");
    });
  });

  describe("repo action", () => {
    it("returns error when username or repo not provided", async () => {
      const out = await githubCommand.execute(["repo", "user"] as any);
      expect(out.type).toBe("error");
      expect(out.content).toContain("provide username and repository name");
    });

    it("returns repo info when both params provided", async () => {
      const out = await githubCommand.execute(["repo", "user", "test-repo"] as any);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Repository");
      expect(out.content as string).toContain("user/test-repo");
    });
  });

  describe("commits action", () => {
    it("returns error when params missing", async () => {
      const out = await githubCommand.execute(["commits"] as any);
      expect(out.type).toBe("error");
    });

    it("returns commits when params provided", async () => {
      const out = await githubCommand.execute(["commits", "user", "repo"] as any);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("commits");
      expect(out.content as string).toContain("Initial commit");
    });
  });

  describe("languages action", () => {
    it("returns error when params missing", async () => {
      const out = await githubCommand.execute(["languages"] as any);
      expect(out.type).toBe("error");
    });

    it("returns language stats when params provided", async () => {
      const out = await githubCommand.execute(["languages", "user", "repo"] as any);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Languages");
      expect(out.content as string).toContain("TypeScript");
    });
  });

  describe("search action", () => {
    it("returns error when no query provided", async () => {
      const out = await githubCommand.execute(["search"] as any);
      expect(out.type).toBe("error");
      expect(out.content).toContain("provide a search query");
    });

    it("returns search results when query provided", async () => {
      const out = await githubCommand.execute(["search", "typescript", "react"] as any);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Search results");
    });
  });

  describe("starred action", () => {
    it("returns error when no username provided", async () => {
      const out = await githubCommand.execute(["starred"] as any);
      expect(out.type).toBe("error");
    });

    it("returns starred repos when username provided", async () => {
      const out = await githubCommand.execute(["starred", "testuser"] as any);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Starred");
    });
  });

  describe("gists action", () => {
    it("returns error when no username provided", async () => {
      const out = await githubCommand.execute(["gists"] as any);
      expect(out.type).toBe("error");
    });

    it("returns gists when username provided", async () => {
      const out = await githubCommand.execute(["gists", "testuser"] as any);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Gist");
    });
  });

  describe("cache action", () => {
    it("shows cache stats with status subaction", async () => {
      const out = await githubCommand.execute(["cache", "status"] as any);
      expect(out.type).toBe("info");
      expect(out.content as string).toContain("Cache");
    });

    it("clears cache when clear action provided", async () => {
      const out = await githubCommand.execute(["cache", "clear"] as any);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("cleared");
    });
  });

  describe("help action", () => {
    it("shows help when help action used", async () => {
      const out = await githubCommand.execute(["help"] as any);
      expect(out.type).toBe("info");
      expect(out.content as string).toContain("GitHub Command Help");
    });

    it("shows help when no action provided", async () => {
      const out = await githubCommand.execute([] as any);
      expect(out.type).toBe("info");
    });
  });

  describe("unknown action", () => {
    it("returns error for unknown action", async () => {
      const out = await githubCommand.execute(["unknown-action"] as any);
      expect(out.type).toBe("error");
      expect(out.content as string).toContain("Unknown GitHub action");
    });
  });
});
