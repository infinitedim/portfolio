import { test, expect } from "@playwright/test";

test.describe("i18n - Internationalization", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("portfolio_locale");
    });
  });

  test.describe("Language Switcher UI", () => {
    test("should display language switcher in header", async ({ page }) => {
      await page.goto("/");

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Language switcher should be visible
      const languageSwitcher = page.locator('[aria-label*="Current language"]');
      await expect(languageSwitcher).toBeVisible();
    });

    test("should open language dropdown on click", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Click language switcher
      const languageSwitcher = page.locator('[aria-label*="Current language"]');
      await languageSwitcher.click();

      // Dropdown should be visible
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();
    });

    test("should show all supported languages", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Open dropdown
      const languageSwitcher = page.locator('[aria-label*="Current language"]');
      await languageSwitcher.click();

      // Check for common languages
      await expect(page.locator('[role="option"]').first()).toBeVisible();

      // Should have multiple options
      const options = page.locator('[role="option"]');
      const count = await options.count();
      expect(count).toBeGreaterThan(5);
    });
  });

  test.describe("Language Switching", () => {
    test("should change language to Indonesian", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Open language switcher
      const languageSwitcher = page.locator('[aria-label*="Current language"]');
      await languageSwitcher.click();

      // Select Indonesian
      const indonesianOption = page.locator('[role="option"]', {
        hasText: "Bahasa Indonesia",
      });
      await indonesianOption.click();

      // Wait for UI to update
      await page.waitForTimeout(500);

      // Verify locale is saved
      const savedLocale = await page.evaluate(() =>
        localStorage.getItem("portfolio_locale"),
      );
      expect(savedLocale).toBe("id_ID");
    });

    test("should persist language preference across page reload", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Set Indonesian locale
      await page.evaluate(() => {
        localStorage.setItem("portfolio_locale", "id_ID");
      });

      // Reload page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Verify locale persisted
      const savedLocale = await page.evaluate(() =>
        localStorage.getItem("portfolio_locale"),
      );
      expect(savedLocale).toBe("id_ID");
    });

    test("should update UI text when language changes", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Get initial text (in English)
      const initialText = await page.locator("body").textContent();

      // Change to Indonesian
      await page.evaluate(() => {
        localStorage.setItem("portfolio_locale", "id_ID");
        // Trigger storage event
        window.dispatchEvent(new Event("storage"));
      });

      // Reload to apply new locale
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Text should be different (Indonesian)
      const newText = await page.locator("body").textContent();

      // The page content should have some differences
      expect(newText).not.toBe(initialText);
    });
  });

  test.describe("Terminal Language Commands", () => {
    test("should list available languages with langlist command", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Wait for terminal to be ready
      await page.waitForSelector('input[type="text"]', { timeout: 10000 });

      // Type langlist command
      const input = page.locator('input[type="text"]').first();
      await input.fill("langlist");
      await input.press("Enter");

      // Wait for output
      await page.waitForTimeout(1000);

      // Check for language list in output
      const output = await page.locator("body").textContent();
      expect(output).toContain("English");
    });

    test("should show current language with lang command", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Wait for terminal
      await page.waitForSelector('input[type="text"]', { timeout: 10000 });

      // Type lang command
      const input = page.locator('input[type="text"]').first();
      await input.fill("lang");
      await input.press("Enter");

      // Wait for output
      await page.waitForTimeout(1000);

      // Should show current language info
      const output = await page.locator("body").textContent();
      expect(output).toContain("en_US");
    });

    test("should change language with lang id_ID command", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Wait for terminal
      await page.waitForSelector('input[type="text"]', { timeout: 10000 });

      // Type lang command to change to Indonesian
      const input = page.locator('input[type="text"]').first();
      await input.fill("lang id_ID");
      await input.press("Enter");

      // Wait for output
      await page.waitForTimeout(1000);

      // Should show success message
      const output = await page.locator("body").textContent();
      expect(output?.toLowerCase()).toContain("indonesian");
    });

    test("should show error for unsupported language", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Wait for terminal
      await page.waitForSelector('input[type="text"]', { timeout: 10000 });

      // Type lang command with invalid locale
      const input = page.locator('input[type="text"]').first();
      await input.fill("lang xx_XX");
      await input.press("Enter");

      // Wait for output
      await page.waitForTimeout(1000);

      // Should show error
      const output = await page.locator("body").textContent();
      expect(output?.toLowerCase()).toContain("not supported");
    });
  });

  test.describe("RTL Support", () => {
    test("should apply RTL direction for Arabic locale", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Change to Arabic
      await page.evaluate(() => {
        localStorage.setItem("portfolio_locale", "ar_SA");
      });

      // Reload
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Check document direction
      const dir = await page.evaluate(() => document.documentElement.dir);
      // Note: This test may need adjustment based on actual implementation
      expect(dir).toBe("rtl");
      // If RTL is properly implemented, it should be 'rtl'
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper ARIA attributes on language switcher", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const languageSwitcher = page.locator('[aria-label*="Current language"]');

      // Check ARIA attributes
      await expect(languageSwitcher).toHaveAttribute("aria-expanded", "false");
      await expect(languageSwitcher).toHaveAttribute(
        "aria-haspopup",
        "listbox",
      );
    });

    test("should support keyboard navigation", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const languageSwitcher = page.locator('[aria-label*="Current language"]');

      // Focus and press Enter
      await languageSwitcher.focus();
      await languageSwitcher.press("Enter");

      // Dropdown should open
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();

      // Press Escape to close
      await page.keyboard.press("Escape");
      await expect(dropdown).not.toBeVisible();
    });
  });
});
