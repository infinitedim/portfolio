import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { GitHubService } from "@/lib/github/github-service";

describe("GitHubService", () => {
  let originalFetch: typeof globalThis.fetch | undefined;

  beforeEach(() => {
    originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({
            login: "infinitedim",
            id: 1,
            avatar_url: "",
            name: "Dimas",
            bio: null,
            public_repos: 0,
            followers: 0,
            following: 0,
            created_at: "",
            updated_at: "",
          }),
          status: 200,
          statusText: "OK",
        }) as unknown as Response,
    );

    // Reset singleton instance to ensure clean state
    (GitHubService as any).instance = undefined;
    // clear cache between tests
    GitHubService.getInstance().clearCache();
  });

  afterEach(() => {
    if (originalFetch) globalThis.fetch = originalFetch;
  });

  it("fetches user and caches the response", async () => {
    const svc = GitHubService.getInstance();

    const user = await svc.getUser("infinitedim");
    expect(user.login).toBe("infinitedim");

    // second call should use cache (fetch called once)
    const user2 = await svc.getUser("infinitedim");
    expect(user2.login).toBe("infinitedim");
    expect((globalThis.fetch as any).mock.calls.length).toBe(1);
  });

  it("clears cache for endpoint and via clearCache", async () => {
    const svc = GitHubService.getInstance();
    await svc.getUser("infinitedim");
    const stats = svc.getCacheStats();
    expect(stats.size).toBeGreaterThan(0);

    svc.clearCacheForEndpoint("/users/infinitedim");
    const stats2 = svc.getCacheStats();
    expect(stats2.size).toBe(0);

    // repopulate then clear all
    await svc.getUser("infinitedim");
    svc.clearCache();
    expect(svc.getCacheStats().size).toBe(0);
  });
});
