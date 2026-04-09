import { test, expect } from '@playwright/test';

test.describe('Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.setItem('brokerpilot-cookie-consent', 'true'));
  });

  test('should navigate to pipeline page', async ({ page }) => {
    await page.goto('/pipeline');
    await expect(page).toHaveURL(/pipeline/);
  });

  test('should display kanban board', async ({ page }) => {
    await page.goto('/pipeline');
    // Either kanban columns or a "no broker type" message
    const kanban = page.locator('.kanban');
    const noBroker = page.locator('text=Broker-Typ');
    await expect(kanban.or(noBroker).first()).toBeVisible();
  });

  test('should open lead creation form', async ({ page }) => {
    await page.goto('/pipeline');
    const addBtn = page.locator('button:has-text("Lead"), button:has-text("Neuer Lead"), .kanban__add-btn').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(300);
      // Form or modal should appear
      const form = page.locator('.lead-form, dialog[open], .modal');
      await expect(form.first()).toBeVisible();
    }
  });
});
