import { test, expect } from '@playwright/test';

test.describe('Advanced Search', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForSelector('h1:has-text("All Contacts")', { timeout: 10000 });
  });

  test('should open advanced search', async ({ page }) => {
    await page.click('button:has-text("Advanced")');
    await page.waitForSelector('.dialog-backdrop', { timeout: 5000 });
    await expect(page.locator('.adv-search-container')).toBeVisible();
    await expect(page.locator('h2:has-text("Advanced Search")')).toBeVisible();
  });

  test('should display all search fields', async ({ page }) => {
    await page.click('button:has-text("Advanced")');
    await page.waitForSelector('.dialog-backdrop', { timeout: 5000 });

    await expect(page.locator('mat-label:has-text("First Name")')).toBeVisible();
    await expect(page.locator('mat-label:has-text("Last Name")')).toBeVisible();
    await expect(page.locator('mat-label:has-text("Mobile")')).toBeVisible();
    await expect(page.locator('mat-label:has-text("City")')).toBeVisible();
  });

  test('should close with Cancel button', async ({ page }) => {
    await page.click('button:has-text("Advanced")');
    await page.waitForSelector('.dialog-backdrop', { timeout: 5000 });

    const dialogFooter = page.locator('.adv-search-footer');
    await dialogFooter.locator('button:has-text("Cancel")').click();

    await page.waitForTimeout(500);
    await expect(page.locator('.dialog-backdrop')).not.toBeVisible();
  });

  test('should apply search and filter results', async ({ page }) => {
    // Click Advanced button
    await page.click('button:has-text("Advanced")');

    // Wait for dialog to appear
    await page.waitForSelector('.dialog-backdrop', { timeout: 5000 });
    await page.waitForSelector('.adv-search-container', { timeout: 5000 });

    // Fill first input in the dialog
    const advSearchContainer = page.locator('.adv-search-container');
    const firstInput = advSearchContainer.locator('input').first();
    await firstInput.waitFor({ state: 'visible', timeout: 5000 });
    await firstInput.fill('Amit');

    // Click Search button in the footer
    const dialogFooter = page.locator('.adv-search-footer');
    const searchButton = dialogFooter.locator('button:has-text("Search")');
    await searchButton.waitFor({ state: 'visible', timeout: 5000 });
    await searchButton.click();

    // Wait for dialog to close
    await page.waitForSelector('.dialog-backdrop', { state: 'hidden', timeout: 5000 });

    // Verify search is active
    await expect(page.locator('button:has-text("Clear")')).toBeVisible({ timeout: 5000 });
  });

});
