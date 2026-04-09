import { test, expect } from '@playwright/test';

test.describe('Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.setItem('brokerpilot-cookie-consent', 'true'));
  });

  test('should display calendar page', async ({ page }) => {
    await page.goto('/kalender');
    await expect(page.locator('h1')).toContainText('Kalender');
  });

  test('should toggle between agenda and month view', async ({ page }) => {
    await page.goto('/kalender');
    const monthBtn = page.locator('button:has-text("Monat")').first();
    if (await monthBtn.isVisible()) {
      await monthBtn.click();
      await page.waitForTimeout(300);
      // Month grid should be visible
      const monthGrid = page.locator('.calendar__month-grid, .calendar__grid');
      await expect(monthGrid.first()).toBeVisible();
    }
  });

  test('should open new event form', async ({ page }) => {
    await page.goto('/kalender');
    const newBtn = page.locator('button:has-text("Neuer Termin"), button:has-text("Neu")').first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await page.waitForTimeout(300);
      // Modal/form should appear
      const modal = page.locator('.calendar__modal, dialog[open]');
      await expect(modal.first()).toBeVisible();
    }
  });
});
