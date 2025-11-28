import { test as base, expect } from "@playwright/test";

/**
 * Custom fixtures for E2E tests
 */

// Define custom fixtures
interface CustomFixtures {
  authenticatedPage: {
    page: import("@playwright/test").Page;
    user: { email: string; role: string };
  };
}

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<CustomFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Mock authentication state
    await page.addInitScript(() => {
      // Set up mock auth tokens in localStorage
      const mockUser = {
        userId: "test-user-id",
        email: "admin@test.com",
        role: "admin",
      };

      localStorage.setItem("accessToken", "mock-access-token");
      localStorage.setItem("refreshToken", "mock-refresh-token");
      localStorage.setItem("user", JSON.stringify(mockUser));
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use({
      page,
      user: { email: "admin@test.com", role: "admin" },
    });

    // Cleanup
    await page.evaluate(() => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    });
  },
});

export { expect };

/**
 * Common test data
 */
export const testData = {
  users: {
    admin: {
      email: "admin@test.com",
      password: "testpassword123",
      role: "admin",
    },
    invalidUser: {
      email: "invalid@test.com",
      password: "wrongpassword",
    },
  },
  projects: {
    sample: {
      title: "Test Project",
      description: "A test project for E2E testing",
      technologies: ["TypeScript", "React", "Node.js"],
    },
  },
  blogPosts: {
    sample: {
      title: "Test Blog Post",
      content: "This is a test blog post content.",
      slug: "test-blog-post",
    },
  },
};

/**
 * Test utilities
 */
export const testUtils = {
  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle(
    page: import("@playwright/test").Page,
  ): Promise<void> {
    await page.waitForLoadState("networkidle");
  },

  /**
   * Fill login form
   */
  async fillLoginForm(
    page: import("@playwright/test").Page,
    email: string,
    password: string,
  ): Promise<void> {
    const emailInput = page
      .locator('input[type="email"], input[name="email"]')
      .first();
    const passwordInput = page
      .locator('input[type="password"], input[name="password"]')
      .first();

    await emailInput.fill(email);
    await passwordInput.fill(password);
  },

  /**
   * Submit login form
   */
  async submitLoginForm(page: import("@playwright/test").Page): Promise<void> {
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
  },

  /**
   * Clear auth state
   */
  async clearAuth(page: import("@playwright/test").Page): Promise<void> {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  },

  /**
   * Check if element is in viewport
   */
  async isInViewport(
    page: import("@playwright/test").Page,
    selector: string,
  ): Promise<boolean> {
    const element = page.locator(selector).first();
    if (!(await element.isVisible())) return false;

    const box = await element.boundingBox();
    if (!box) return false;

    const viewport = page.viewportSize();
    if (!viewport) return false;

    return (
      box.x >= 0 &&
      box.y >= 0 &&
      box.x + box.width <= viewport.width &&
      box.y + box.height <= viewport.height
    );
  },

  /**
   * Get all console errors
   */
  async collectConsoleErrors(
    page: import("@playwright/test").Page,
    fn: () => Promise<void>,
  ): Promise<string[]> {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await fn();

    return errors;
  },

  /**
   * Check page for accessibility issues (basic)
   */
  async checkBasicA11y(page: import("@playwright/test").Page): Promise<{
    hasH1: boolean;
    hasMainLandmark: boolean;
    hasSkipLink: boolean;
    imagesHaveAlt: boolean;
  }> {
    const hasH1 = (await page.locator("h1").count()) > 0;
    const hasMainLandmark =
      (await page.locator('main, [role="main"]').count()) > 0;
    const hasSkipLink =
      (await page.locator('a[href="#main"], a[href="#content"]').count()) > 0;

    const images = page.locator("img");
    const imageCount = await images.count();
    let imagesHaveAlt = true;

    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      const role = await images.nth(i).getAttribute("role");
      if (alt === null && role !== "presentation") {
        imagesHaveAlt = false;
        break;
      }
    }

    return {
      hasH1,
      hasMainLandmark,
      hasSkipLink,
      imagesHaveAlt,
    };
  },

  /**
   * Take screenshot with timestamp
   */
  async takeTimestampedScreenshot(
    page: import("@playwright/test").Page,
    name: string,
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    await page.screenshot({ path: `test-results/${name}-${timestamp}.png` });
  },

  /**
   * Mock API response
   */
  async mockApiResponse(
    page: import("@playwright/test").Page,
    urlPattern: string | RegExp,
    response: { status?: number; body?: unknown },
  ): Promise<void> {
    await page.route(urlPattern, (route) => {
      route.fulfill({
        status: response.status || 200,
        contentType: "application/json",
        body: JSON.stringify(response.body || {}),
      });
    });
  },
};
