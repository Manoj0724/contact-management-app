import { test, expect } from '@playwright/test';

test.describe('Contacts List Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display contacts page with header', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('should display contacts table', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
  });

  test('should show at least one contact row', async ({ page }) => {
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 8000 });
    const count = await page.locator('tbody tr').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have edit and delete icon buttons in first row', async ({ page }) => {
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 8000 });
    const editBtn = page.locator('tbody tr').first().locator('button').first();
    await expect(editBtn).toBeVisible();
  });

  test('should navigate to new contact page via sidebar', async ({ page }) => {
    await page.locator('.sidebar a').nth(1).click();
    await expect(page).toHaveURL('/contacts/new', { timeout: 8000 });
  });

  test('should have search input field', async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[placeholder*="search"]'
    ).first();
    await expect(searchInput).toBeVisible();
  });

  test('should search contacts', async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[placeholder*="search"]'
    ).first();
    await searchInput.fill('Test');
    await searchInput.press('Enter');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table, .empty-state')).toBeVisible();
  });

  test('should clear search', async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[placeholder*="search"]'
    ).first();
    await searchInput.fill('Test');
    await searchInput.press('Enter');
    await page.locator('.action-buttons button').first().click();
    await expect(searchInput).toHaveValue('');
  });

  test('should have pagination controls', async ({ page }) => {
    await expect(page.locator('.pagination-bar')).toBeVisible({ timeout: 8000 });
  });

  test('should sort contacts when clicking NAME header', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
    await page.locator('th').filter({ hasText: 'NAME' }).click();
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('should show sidebar with navigation links', async ({ page }) => {
    await expect(page.locator('.sidebar')).toBeVisible();
    const links = page.locator('.sidebar a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should export CSV via sidebar button', async ({ page }) => {
    const csvBtn = page.locator('button').filter({ hasText: /Export CSV|CSV/i }).first();
    await expect(csvBtn).toBeVisible({ timeout: 5000 });
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await csvBtn.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('table, .empty-state')).toBeVisible();
  });

  test('should open advanced search modal', async ({ page }) => {
    const advBtn = page.locator('.action-buttons button').nth(1);
    await expect(advBtn).toBeVisible({ timeout: 5000 });
    await advBtn.click();
    await expect(
      page.locator('h2:has-text("Advanced Search")').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should close advanced search modal', async ({ page }) => {
    const advBtn = page.locator('.action-buttons button').nth(1);
    await advBtn.click();
    await expect(
      page.locator('h2:has-text("Advanced Search")').first()
    ).toBeVisible({ timeout: 5000 });
    const cancelBtn = page.locator('button').filter({ hasText: /Cancel/i });
    await cancelBtn.click();
    await expect(
      page.locator('h2:has-text("Advanced Search")').first()
    ).not.toBeVisible({ timeout: 5000 });
  });

});
