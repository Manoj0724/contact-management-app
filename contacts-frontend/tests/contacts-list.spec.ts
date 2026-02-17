import { test, expect } from '@playwright/test';

/**
 * CONTACTS LIST PAGE - E2E Tests
 */

test.describe('Contacts List Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  test('should load contacts list page', async ({ page }) => {
    await expect(page).toHaveURL('/contacts');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to new contact page via sidebar', async ({ page }) => {
    // ✅ FIXED: Use text filter instead of nth() - more reliable
    await page.locator('.sidebar a').filter({ hasText: /Add Contact/i }).click();
    await expect(page).toHaveURL('/contacts/new', { timeout: 8000 });
  });

  test('should have search input field', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test('should display contacts table', async ({ page }) => {
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show pagination controls', async ({ page }) => {
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    const pagination = page.locator('.pagination-bar');
    await expect(pagination).toBeVisible();
  });

});
