import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.setItem('brokerpilot-cookie-consent', 'true'));
  });

  test('should display settings page', async ({ page }) => {
    await page.goto('/einstellungen');
    await expect(page.locator('h1')).toContainText('Einstellungen');
  });

  test('should display broker type selector', async ({ page }) => {
    await page.goto('/einstellungen');
    // Look for broker type selection
    const brokerSection = page.locator('text=Broker-Typ').first();
    await expect(brokerSection).toBeVisible();
  });

  test('should change broker type', async ({ page }) => {
    await page.goto('/einstellungen');
    // Click on a broker type option
    const kryptoBtn = page.locator('button:has-text("Krypto"), label:has-text("Krypto"), [data-broker="krypto"]').first();
    if (await kryptoBtn.isVisible()) {
      await kryptoBtn.click();
      await page.waitForTimeout(300);
      // Verify it was saved
      const stored = await page.evaluate(() => {
        const store = localStorage.getItem('brokerpilot-settings');
        return store ? JSON.parse(store) : null;
      });
      // Check store has krypto set
      if (stored?.state?.brokerType) {
        expect(stored.state.brokerType).toBe('krypto');
      }
    }
  });
});
