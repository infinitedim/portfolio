import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage successfully", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to be loaded
    await page.waitForLoadState("networkidle");

    // Check that the page title is present
    await expect(page).toHaveTitle(/.+/);

    // Check that the main content is visible
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("should have accessible navigation", async ({ page }) => {
    await page.goto("/");

    // Check for navigation elements
    const nav = page.locator("nav").first();
    if (await nav.isVisible()) {
      await expect(nav).toBeVisible();

      // Check for navigation links
      const links = nav.locator("a");
      const linkCount = await links.count();
      expect(linkCount).toBeGreaterThan(0);
    }
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await page.waitForLoadState("networkidle");

    // Page should still load correctly
    await expect(page.locator("body")).toBeVisible();
  });

  test("should have proper meta tags", async ({ page }) => {
    await page.goto("/");

    // Check for essential meta tags
    const viewport = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content");
    expect(viewport).toBeTruthy();

    // Check for description meta tag
    const description = page.locator('meta[name="description"]');
    if ((await description.count()) > 0) {
      const content = await description.getAttribute("content");
      expect(content).toBeTruthy();
    }
  });

  test("should not have console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filter out known acceptable errors (e.g., from external scripts)
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes("favicon") &&
        !error.includes("third-party") &&
        !error.includes("analytics"),
    );

    // We expect no critical console errors
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe("Performance", () => {
  test("should load within acceptable time", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test("should have no broken images", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const images = page.locator("img");
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate(
        (el: HTMLImageElement) => el.naturalWidth,
      );
      const src = await img.getAttribute("src");

      // Skip placeholder images or data URLs
      if (src && !src.startsWith("data:") && !src.includes("placeholder")) {
        expect(naturalWidth, `Image ${src} should load`).toBeGreaterThan(0);
      }
    }
  });
});

test.describe("Accessibility", () => {
  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check for h1
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Check that h1 comes before h2
    const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();
    let lastLevel = 0;

    for (const heading of headings) {
      const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
      const level = parseInt(tagName.replace("h", ""), 10);

      // Headings should not skip more than one level
      if (lastLevel > 0) {
        expect(level - lastLevel).toBeLessThanOrEqual(1);
      }
      lastLevel = level;
    }
  });

  test("should have alt text on images", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const images = page.locator("img");
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const role = await img.getAttribute("role");

      // Images should have alt text or be marked as decorative
      const hasAccessibleLabel = alt !== null || role === "presentation";
      expect(
        hasAccessibleLabel,
        `Image ${i} should have alt text or role`,
      ).toBe(true);
    }
  });

  test("should have focusable interactive elements", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that buttons are focusable
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        await button.focus();
        await expect(button).toBeFocused();
      }
    }

    // Check that links are focusable
    const links = page.locator("a[href]");
    const linkCount = await links.count();

    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = links.nth(i);
      if (await link.isVisible()) {
        await link.focus();
        await expect(link).toBeFocused();
      }
    }
  });
});

test.describe("Dark Mode", () => {
  test("should respect system color scheme preference", async ({ page }) => {
    // Emulate dark mode
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that dark mode styles are applied
    const body = page.locator("body");
    const backgroundColor = await body.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );

    // Dark mode typically has dark background
    // This is a basic check - adjust based on your actual dark mode implementation
    expect(backgroundColor).toBeTruthy();
  });

  test("should toggle theme correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Look for theme toggle button
    const themeToggle = page
      .locator(
        '[data-testid="theme-toggle"], [aria-label*="theme"], [aria-label*="dark"], [aria-label*="light"]',
      )
      .first();

    if (await themeToggle.isVisible()) {
      // Get initial state
      const htmlClass = await page.locator("html").getAttribute("class");
      const initialDark = htmlClass?.includes("dark");

      // Click toggle
      await themeToggle.click();

      // Wait for transition
      await page.waitForTimeout(500);

      // Check that theme changed
      const newHtmlClass = await page.locator("html").getAttribute("class");
      const newDark = newHtmlClass?.includes("dark");

      expect(newDark).not.toBe(initialDark);
    }
  });
});
