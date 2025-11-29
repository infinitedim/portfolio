import { GitHubService } from "@/lib/github/githubService";
import type { Command, CommandOutput } from "@/types/terminal";

export const githubCommand: Command = {
  name: "github",
  description: "GitHub integration and repository management",
  aliases: ["gh", "git", "repo"],
  async execute(args: string[]): Promise<CommandOutput> {
    const [action, ...params] = args;

    switch (action) {
      case "user":
        return getUserInfo(params[0]);
      case "repos":
        return getUserRepos(params[0]);
      case "repo":
        return getRepoInfo(params[0], params[1]);
      case "commits":
        return getRepoCommits(params[0], params[1]);
      case "languages":
        return getRepoLanguages(params[0], params[1]);
      case "search":
        return searchRepos(params.join(" "));
      case "starred":
        return getStarredRepos(params[0]);
      case "gists":
        return getUserGists(params[0]);
      case "cache":
        return manageCache(params[0]);
      case "help":
        return showGitHubHelp();
      default:
        if (!action) {
          return showGitHubHelp();
        }
        return {
          type: "error",
          content: `Unknown GitHub action: ${action}. Use 'github help' for available commands.`,
          timestamp: new Date(),
          id: "github-unknown-action",
        };
    }
  },
};

/**
 * Get user information
 * @param {string} username - The GitHub username
 * @returns {CommandOutput} The command output
 */
async function getUserInfo(username: string): Promise<CommandOutput> {
  if (!username) {
    return {
      type: "error",
      content: "Please provide a username. Usage: github user <username>",
      timestamp: new Date(),
      id: "github-no-username",
    };
  }

  try {
    const githubService = GitHubService.getInstance();
    const user = await githubService.getUser(username);

    return {
      type: "success",
      content: `👤 GitHub User: ${user.login}\n📝 ${user.bio || "No bio"}\n📍 \n🔗 ${user.name}\n👥 Followers: ${user.followers}\n👥 Following: ${user.following}\n📦 Public repos: ${user.public_repos}`,
      timestamp: new Date(),
      id: "github-user-info",
    };
  } catch (error) {
    return {
      type: "error",
      content: `Failed to fetch user info: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      id: "github-user-error",
    };
  }
}

/**
 * Get user repositories
 * @param {string} username - The GitHub username
 * @returns {CommandOutput} The command output
 */
async function getUserRepos(username: string): Promise<CommandOutput> {
  if (!username) {
    return {
      type: "error",
      content: "Please provide a username. Usage: github repos <username>",
      timestamp: new Date(),
      id: "github-no-username",
    };
  }

  try {
    const githubService = GitHubService.getInstance();
    const repos = await githubService.getUserRepos(username);

    if (repos.length === 0) {
      return {
        type: "info",
        content: "No repositories found.",
        timestamp: new Date(),
        id: "github-no-repos",
      };
    }

    const repoList = repos
      .slice(0, 10) // Show only first 10 repos
      .map((repo) => {
        const language = repo.language || "Unknown";
        const stars = repo.stargazers_count;
        const forks = repo.forks_count;
        return `📦 ${repo.name}\n   📝 ${repo.description || "No description"}\n   🔤 ${language} | ⭐ ${stars} | 🍴 ${forks}\n   🔗 ${repo.html_url}`;
      })
      .join("\n\n");

    const moreText =
      repos.length > 10
        ? `\n\n... and ${repos.length - 10} more repositories`
        : "";

    return {
      type: "success",
      content: `📦 Repositories for ${username}:\n\n${repoList}${moreText}`,
      timestamp: new Date(),
      id: "github-repos-list",
    };
  } catch (error) {
    return {
      type: "error",
      content: `Failed to fetch repositories: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      id: "github-repos-error",
    };
  }
}

/**
 * Get repository information
 * @param {string} username - The GitHub username
 * @param {string} repoName - The repository name
 * @returns {CommandOutput} The command output
 */
async function getRepoInfo(
  username: string,
  repoName: string,
): Promise<CommandOutput> {
  if (!username || !repoName) {
    return {
      type: "error",
      content:
        "Please provide username and repository name. Usage: github repo <username> <repo-name>",
      timestamp: new Date(),
      id: "github-invalid-repo-params",
    };
  }

  try {
    const githubService = GitHubService.getInstance();
    const repo = await githubService.getRepo(username, repoName);

    return {
      type: "success",
      content: `📦 Repository: ${repo.full_name}\n📝 ${repo.description || "No description"}\n🔤 Language: ${repo.language || "Unknown"}\n⭐ Stars: ${repo.stargazers_count}\n🍴 Forks: ${repo.forks_count}\n👀 Watchers: ${repo.watchers_count}\n📅 Created: ${new Date(repo.created_at).toLocaleDateString()}\n🔄 Updated: ${new Date(repo.updated_at).toLocaleDateString()}\n🔗 ${repo.html_url}`,
      timestamp: new Date(),
      id: "github-repo-info",
    };
  } catch (error) {
    return {
      type: "error",
      content: `Failed to fetch repository info: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      id: "github-repo-error",
    };
  }
}

/**
 * Get repository commits
 * @param {string} username - The GitHub username
 * @param {string} repoName - The repository name
 * @returns {CommandOutput} The command output
 */
async function getRepoCommits(
  username: string,
  repoName: string,
): Promise<CommandOutput> {
  if (!username || !repoName) {
    return {
      type: "error",
      content:
        "Please provide username and repository name. Usage: github commits <username> <repo-name>",
      timestamp: new Date(),
      id: "github-invalid-commit-params",
    };
  }

  try {
    const githubService = GitHubService.getInstance();
    const commits = await githubService.getRepoCommits(username, repoName);

    if (commits.length === 0) {
      return {
        type: "info",
        content: "No commits found.",
        timestamp: new Date(),
        id: "github-no-commits",
      };
    }

    const commitList = commits
      .slice(0, 5) // Show only first 5 commits
      .map((commit) => {
        const date = new Date(commit.commit.author.date).toLocaleDateString();
        return `🔨 ${commit.commit.message.split("\n")[0]}\n   👤 ${commit.commit.author.name}\n   📅 ${date}\n   🔗 ${commit.commit}`;
      })
      .join("\n\n");

    const moreText =
      commits.length > 5
        ? `\n\n... and ${commits.length - 5} more commits`
        : "";

    return {
      type: "success",
      content: `🔨 Recent commits for ${username}/${repoName}:\n\n${commitList}${moreText}`,
      timestamp: new Date(),
      id: "github-commits-list",
    };
  } catch (error) {
    return {
      type: "error",
      content: `Failed to fetch commits: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      id: "github-commits-error",
    };
  }
}

/**
 * Get repository languages
 * @param {string} username - The GitHub username
 * @param {string} repoName - The repository name
 * @returns {CommandOutput} The command output
 */
async function getRepoLanguages(
  username: string,
  repoName: string,
): Promise<CommandOutput> {
  if (!username || !repoName) {
    return {
      type: "error",
      content:
        "Please provide username and repository name. Usage: github languages <username> <repo-name>",
      timestamp: new Date(),
      id: "github-invalid-lang-params",
    };
  }

  try {
    const githubService = GitHubService.getInstance();
    const languages = await githubService.getRepoLanguages(username, repoName);

    if (Object.keys(languages).length === 0) {
      return {
        type: "info",
        content: "No language data found for this repository.",
        timestamp: new Date(),
        id: "github-no-languages",
      };
    }

    const totalBytes = Object.values(languages).reduce(
      (sum, bytes) => sum + bytes,
      0,
    );
    const languageList = Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .map(([language, bytes]) => {
        const percentage = ((bytes / totalBytes) * 100).toFixed(1);
        return `🔤 ${language}: ${percentage}% (${bytes.toLocaleString()} bytes)`;
      })
      .join("\n");

    return {
      type: "success",
      content: `🔤 Languages used in ${username}/${repoName}:\n\n${languageList}`,
      timestamp: new Date(),
      id: "github-languages",
    };
  } catch (error) {
    return {
      type: "error",
      content: `Failed to fetch languages: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      id: "github-languages-error",
    };
  }
}

/**
 * Search repositories
 * @param {string} query - The search query
 * @returns {CommandOutput} The command output
 */
async function searchRepos(query: string): Promise<CommandOutput> {
  if (!query) {
    return {
      type: "error",
      content: "Please provide a search query. Usage: github search <query>",
      timestamp: new Date(),
      id: "github-no-search-query",
    };
  }

  try {
    const githubService = GitHubService.getInstance();
    const repos = await githubService.searchRepos(query);

    if (repos.items.length === 0) {
      return {
        type: "info",
        content: `No repositories found matching '${query}'.`,
        timestamp: new Date(),
        id: "github-search-no-results",
      };
    }

    const repoList = repos.items
      .slice(0, 5) // Show only first 5 results
      .map((repo) => {
        const language = repo.language || "Unknown";
        const stars = repo.stargazers_count;
        return `📦 ${repo.full_name}\n   📝 ${repo.description || "No description"}\n   🔤 ${language} | ⭐ ${stars}\n   🔗 ${repo.html_url}`;
      })
      .join("\n\n");

    const moreText =
      repos.items.length > 5
        ? `\n\n... and ${repos.items.length - 5} more repositories`
        : "";

    return {
      type: "success",
      content: `🔍 Search results for '${query}':\n\n${repoList}${moreText}`,
      timestamp: new Date(),
      id: "github-search-results",
    };
  } catch (error) {
    return {
      type: "error",
      content: `Failed to search repositories: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      id: "github-search-error",
    };
  }
}

/**
 * Get starred repositories
 * @param {string} username - The GitHub username
 * @returns {CommandOutput} The command output
 */
async function getStarredRepos(username: string): Promise<CommandOutput> {
  if (!username) {
    return {
      type: "error",
      content: "Please provide a username. Usage: github starred <username>",
      timestamp: new Date(),
      id: "github-no-username",
    };
  }

  try {
    const githubService = GitHubService.getInstance();
    const repos = await githubService.getUserStarredRepos(username);

    if (repos.length === 0) {
      return {
        type: "info",
        content: "No starred repositories found.",
        timestamp: new Date(),
        id: "github-no-starred",
      };
    }

    const repoList = repos
      .slice(0, 5) // Show only first 5 starred repos
      .map((repo) => {
        const language = repo.language || "Unknown";
        const stars = repo.stargazers_count;
        return `⭐ ${repo.full_name}\n   📝 ${repo.description || "No description"}\n   🔤 ${language} | ⭐ ${stars}\n   🔗 ${repo.html_url}`;
      })
      .join("\n\n");

    const moreText =
      repos.length > 5
        ? `\n\n... and ${repos.length - 5} more starred repositories`
        : "";

    return {
      type: "success",
      content: `⭐ Starred repositories by ${username}:\n\n${repoList}${moreText}`,
      timestamp: new Date(),
      id: "github-starred-list",
    };
  } catch (error) {
    return {
      type: "error",
      content: `Failed to fetch starred repositories: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      id: "github-starred-error",
    };
  }
}

/**
 * Get user gists
 * @param {string} username - The GitHub username
 * @returns {CommandOutput} The command output
 */
async function getUserGists(username: string): Promise<CommandOutput> {
  if (!username) {
    return {
      type: "error",
      content: "Please provide a username. Usage: github gists <username>",
      timestamp: new Date(),
      id: "github-no-username",
    };
  }

  try {
    const githubService = GitHubService.getInstance();
    const gists = (await githubService.getUserGists(username)) as Array<{
      description: string | null;
      files: Record<string, unknown>;
      created_at: string;
      html_url: string;
    }>;

    if (gists.length === 0) {
      return {
        type: "info",
        content: "No gists found.",
        timestamp: new Date(),
        id: "github-no-gists",
      };
    }

    const gistList = gists
      .slice(0, 5) // Show only first 5 gists
      .map(
        (gist: {
          description: string | null;
          files: Record<string, unknown>;
          created_at: string;
          html_url: string;
        }) => {
          const files = Object.keys(gist.files).length;
          return `📄 ${gist.description || "Untitled gist"}\n   📁 ${files} file(s)\n   📅 ${new Date(gist.created_at).toLocaleDateString()}\n   🔗 ${gist.html_url}`;
        },
      )
      .join("\n\n");

    const moreText =
      gists.length > 5 ? `\n\n... and ${gists.length - 5} more gists` : "";

    return {
      type: "success",
      content: `📄 Gists by ${username}:\n\n${gistList}${moreText}`,
      timestamp: new Date(),
      id: "github-gists-list",
    };
  } catch (error) {
    return {
      type: "error",
      content: `Failed to fetch gists: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      id: "github-gists-error",
    };
  }
}

/**
 * Manage cache
 * @param {string} action - The cache action (clear, status)
 * @returns {CommandOutput} The command output
 */
function manageCache(action: string): CommandOutput {
  const githubService = GitHubService.getInstance();

  switch (action) {
    case "clear":
      githubService.clearCache();
      return {
        type: "success",
        content: "GitHub API cache cleared successfully.",
        timestamp: new Date(),
        id: "github-cache-cleared",
      };
    case "status": {
      const cacheStatus = githubService.getCacheStats();
      return {
        type: "info",
        content: `📊 Cache Status:\n   Cached requests: ${cacheStatus.entries}\n   Cache size: ${cacheStatus.size} items`,
        timestamp: new Date(),
        id: "github-cache-status",
      };
    }
    default:
      return {
        type: "error",
        content:
          "Invalid cache action. Use 'github cache clear' or 'github cache status'",
        timestamp: new Date(),
        id: "github-cache-invalid",
      };
  }
}

/**
 * Show GitHub help
 * @returns {CommandOutput} The command output
 */
function showGitHubHelp(): CommandOutput {
  return {
    type: "info",
    content: `🐙 GitHub Command Help

Available commands:
  github user <username>           - Get user information
  github repos <username>          - List user repositories
  github repo <user> <repo>        - Get repository information
  github commits <user> <repo>     - Get recent commits
  github languages <user> <repo>   - Get repository languages
  github search <query>            - Search repositories
  github starred <username>        - Get starred repositories
  github gists <username>          - Get user gists
  github cache clear               - Clear API cache
  github cache status              - Show cache status
  github help                      - Show this help

Examples:
  github user infinitedim
  github repos infinitedim
  github search react typescript
  github repo infinitedim portfolio-terminal`,
    timestamp: new Date(),
    id: "github-help",
  };
}
