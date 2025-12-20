export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  archived: boolean;
  disabled: boolean;
  fork: boolean;
  private: boolean;
  license: {
    name: string;
    url: string;
  } | null;
  default_branch: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

export class GitHubService {
  private static instance: GitHubService;
  private baseUrl = "https://api.github.com";
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000;

  private constructor() {}

  static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      if (typeof cached.data === "object" && cached.data !== null) {
        return cached.data as T;
      } else {
        throw new Error("Invalid cached data");
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Portfolio-Terminal-App",
      },
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    if (typeof data === "object" && data !== null) {
      return data as T;
    } else {
      throw new Error("Invalid response from GitHub");
    }
  }

  async getUser(username: string): Promise<GitHubUser> {
    return this.makeRequest<GitHubUser>(`/users/${username}`);
  }

  async getUserRepos(
    username: string,
    page: number = 1,
    perPage: number = 100,
  ): Promise<GitHubRepo[]> {
    return this.makeRequest<GitHubRepo[]>(
      `/users/${username}/repos?page=${page}&per_page=${perPage}&sort=updated`,
    );
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    return this.makeRequest<GitHubRepo>(`/repos/${owner}/${repo}`);
  }

  async getRepoCommits(
    owner: string,
    repo: string,
    page: number = 1,
    perPage: number = 10,
  ): Promise<GitHubCommit[]> {
    return this.makeRequest<GitHubCommit[]>(
      `/repos/${owner}/${repo}/commits?page=${page}&per_page=${perPage}`,
    );
  }

  async getRepoLanguages(
    owner: string,
    repo: string,
  ): Promise<Record<string, number>> {
    return this.makeRequest<Record<string, number>>(
      `/repos/${owner}/${repo}/languages`,
    );
  }

  async getRepoTopics(
    owner: string,
    repo: string,
  ): Promise<{ names: string[] }> {
    return this.makeRequest<{ names: string[] }>(
      `/repos/${owner}/${repo}/topics`,
    );
  }

  async searchRepos(
    query: string,
    page: number = 1,
    perPage: number = 30,
  ): Promise<{
    total_count: number;
    items: GitHubRepo[];
  }> {
    return this.makeRequest<{
      total_count: number;
      items: GitHubRepo[];
    }>(
      `/search/repositories?q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&sort=stars`,
    );
  }

  async getUserStarredRepos(
    username: string,
    page: number = 1,
    perPage: number = 100,
  ): Promise<GitHubRepo[]> {
    return this.makeRequest<GitHubRepo[]>(
      `/users/${username}/starred?page=${page}&per_page=${perPage}`,
    );
  }

  async getUserGists(
    username: string,
    page: number = 1,
    perPage: number = 100,
  ): Promise<unknown[]> {
    return this.makeRequest<unknown[]>(
      `/users/${username}/gists?page=${page}&per_page=${perPage}`,
    );
  }

  async getAllUserRepos(username: string): Promise<GitHubRepo[]> {
    const allRepos: GitHubRepo[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const repos = await this.getUserRepos(username, page);
      if (repos.length === 0) {
        hasMore = false;
      } else {
        allRepos.push(...repos);
        page++;
      }
    }

    return allRepos;
  }

  async getReposByLanguage(
    username: string,
    language: string,
  ): Promise<GitHubRepo[]> {
    const allRepos = await this.getAllUserRepos(username);
    return allRepos.filter(
      (repo) =>
        repo.language && repo.language.toLowerCase() === language.toLowerCase(),
    );
  }

  async getReposByTopic(
    username: string,
    topic: string,
  ): Promise<GitHubRepo[]> {
    const allRepos = await this.getAllUserRepos(username);
    const reposWithTopics: GitHubRepo[] = [];

    for (const repo of allRepos) {
      try {
        const topics = await this.getRepoTopics(username, repo.name);
        if (
          topics.names.some((t) =>
            t.toLowerCase().includes(topic.toLowerCase()),
          )
        ) {
          reposWithTopics.push(repo);
        }
      } catch (error) {
        console.warn(`Failed to get topics for ${repo.name}:`, error);
      }
    }

    return reposWithTopics;
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearCacheForEndpoint(endpoint: string): void {
    this.cache.delete(endpoint);
  }

  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}
