import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '/dashboard', title: 'Dashboard' },
  { path: '/pipeline', title: 'Pipeline' },
  { path: '/markt', title: 'Markt' },
  { path: '/ai-agents', title: 'KI-Agenten' },
  { path: '/analytics', title: 'Analytics' },
  { path: '/kalender', title: 'Kalender' },
  { path: '/team', title: 'Team' },
  { path: '/kampagnen', title: 'Kampagnen' },
  { path: '/workflows', title: 'Workflows' },
  { path: '/einstellungen', title: 'Einstellungen' },
];

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.setItem('brokerpilot-cookie-consent', 'true'));
  });

  for (const route of ROUTES) {
    test(`should navigate to ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path));
      // Page should load without errors (no error boundary)
      await expect(page.locator('.error-boundary')).not.toBeVisible();
    });
  }

  test('should redirect unknown routes to home', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/(dashboard)?$/);
  });

  test('should display client portal', async ({ page }) => {
    await page.goto('/portal/test-token');
    // Should show portal or error (no valid token)
    const portal = page.locator('.portal');
    await expect(portal).toBeVisible();
  });
});
