import { test, expect } from '@playwright/test';

test.describe('Advanced Search', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('should open advanced search', async ({ page }) => {
    // Advanced button is the 2nd button in action-buttons
    const advBtn = page.locator('.action-buttons button').nth(1);
    await expect(advBtn).toBeVisible({ timeout: 5000 });
    await advBtn.click();
    // Check dialog opened - either our custom or mat-dialog
    await expect(
      page.locator('.adv-search-container').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should display all search fields', async ({ page }) => {
    const advBtn = page.locator('.action-buttons button').nth(1);
    await advBtn.click();

    // Wait for dialog
    const dialog = page.locator('.adv-search-container').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Check inputs exist inside dialog
    const inputs = dialog.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should close with Cancel button', async ({ page }) => {
    const advBtn = page.locator('.action-buttons button').nth(1);
    await advBtn.click();

    const dialog = page.locator('.adv-search-container').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Click Cancel - it's in dialog-footer
    const cancelBtn = page.locator('.adv-search-footer button')
                          .filter({ hasText: /Cancel/i }).first();
    await cancelBtn.click();

    await expect(
      page.locator('.adv-search-container').first()
    ).not.toBeVisible({ timeout: 5000 });
  });

  test('should apply search and filter results', async ({ page }) => {
    const advBtn = page.locator('.action-buttons button').nth(1);
    await advBtn.click();

    const dialog = page.locator('.adv-search-container').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Fill last input field (City)
    const inputs = dialog.locator('input');
    const count = await inputs.count();
    if (count > 0) {
      await inputs.last().fill('Delhi');
    }

    // Click Search button in dialog footer
    const searchBtn = page.locator('.adv-search-footer button')
                          .filter({ hasText: /Search/i }).first();
    await searchBtn.click();

    // Dialog should close
    await expect(
      page.locator('.adv-search-container').first()
    ).not.toBeVisible({ timeout: 5000 });

    // Results should show
    await expect(page.locator('table, .empty-state')).toBeVisible({ timeout: 8000 });
  });

});
