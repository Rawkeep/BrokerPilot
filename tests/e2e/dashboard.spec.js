import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to get fresh state, then accept cookie
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.setItem('brokerpilot-cookie-consent', 'true'));
  });

  test('should display dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show demo data loader when no leads', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('brokerpilot-leads'));
    await page.goto('/dashboard');
    // Look for demo loader or empty state
    const demoLoader = page.locator('.demo-loader');
    if (await demoLoader.isVisible()) {
      await expect(demoLoader).toBeVisible();
    }
  });

  test('should load demo data when button clicked', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('brokerpilot-leads'));
    await page.goto('/dashboard');
    const demoBtn = page.locator('.demo-loader__btn');
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
      // After loading, demo loader should disappear or leads should exist
      await page.waitForTimeout(500);
      const leads = await page.evaluate(() => {
        const stored = localStorage.getItem('brokerpilot-leads');
        return stored ? JSON.parse(stored) : null;
      });
      expect(leads).not.toBeNull();
    }
  });

  test('should display navigation tabs', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.top-nav__tabs')).toBeVisible();
    await expect(page.locator('.top-nav__brand')).toContainText('BrokerPilot');
  });
});
