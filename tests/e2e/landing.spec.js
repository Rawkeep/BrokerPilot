import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display hero section', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.locator('.landing__hero-title')).toBeVisible();
    await expect(page.locator('.landing__hero-title')).toContainText('Broker-CRM');
  });

  test('should display all 8 features', async ({ page }) => {
    await page.goto('/welcome');
    const features = page.locator('.landing__feature-card');
    await expect(features).toHaveCount(8);
  });

  test('should display 3 pricing tiers', async ({ page }) => {
    await page.goto('/welcome');
    const pricing = page.locator('.landing__pricing-card');
    await expect(pricing).toHaveCount(3);
  });

  test('should navigate to dashboard from CTA', async ({ page }) => {
    await page.goto('/welcome');
    await page.click('.landing__hero-actions .landing__btn--primary');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should show cookie banner on first visit', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.locator('.cookie-banner')).toBeVisible();
  });

  test('should hide cookie banner after accepting', async ({ page }) => {
    await page.goto('/welcome');
    await page.click('.cookie-banner__btn--accept');
    await expect(page.locator('.cookie-banner')).not.toBeVisible();
  });

  test('should navigate to legal pages', async ({ page }) => {
    await page.goto('/impressum');
    await expect(page.locator('.legal-page h1')).toContainText('Impressum');

    await page.goto('/datenschutz');
    await expect(page.locator('.legal-page h1')).toContainText('Datenschutz');

    await page.goto('/agb');
    await expect(page.locator('.legal-page h1')).toContainText('Geschäftsbedingungen');
  });
});
