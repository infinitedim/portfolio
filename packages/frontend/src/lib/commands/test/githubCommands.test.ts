import { describe, it, expect, vi } from "vitest";

vi.mock("@portfolio/frontend/src/lib/github/githubService", () => {
  const mock = {
    getInstance: () => ({
      getUser: async (u: string) => ({
        login: u,
        id: 1,
        avatar_url: "",
        name: "D",
        bio: null,
        public_repos: 0,
        followers: 0,
        following: 0,
        created_at: "",
        updated_at: "",
      }),
      getUserRepos: async () => [
        {
          name: "r1",
          html_url: "",
          language: "TS",
          stargazers_count: 0,
          forks_count: 0,
          description: "",
        },
      ],
      getRepo: async () => ({
        full_name: "u/r",
        description: "",
        language: "TS",
        stargazers_count: 0,
        forks_count: 0,
        watchers_count: 0,
        created_at: "",
        updated_at: "",
        html_url: "",
      }),
      getRepoCommits: async () => [],
      getRepoLanguages: async () => ({ TypeScript: 100 }),
      searchRepos: async () => ({ total_count: 0, items: [] }),
      getUserStarredRepos: async () => [],
      getUserGists: async () => [],
      clearCache: () => {},
      getCacheStats: () => ({ size: 0, entries: [] }),
    }),
  };
  return { GitHubService: mock };
});

import { githubCommand } from "../githubCommands";

describe("githubCommand", () => {
  it("user without username returns error", async () => {
    const out = await githubCommand.execute(["user"] as any);
    expect(out.type).toBe("error");
  });

  it("user with username returns success", async () => {
    const out = await githubCommand.execute(["user", "infinitedim"] as any);
    expect(out.type).toBe("success");
    expect(out.content as string).toContain("GitHub User");
  });
});
