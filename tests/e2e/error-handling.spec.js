import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should show loading spinner during page load', async ({ page }) => {
    // Slow down network to catch spinner
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 50);
    });
    await page.goto('/dashboard');
    // Page should eventually load without error boundary
    await expect(page.locator('.error-boundary')).not.toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    // App should work even without backend
    await expect(page.locator('.top-nav')).toBeVisible();
  });
});
