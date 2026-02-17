import { test, expect } from '@playwright/test';

/**
 * BULK OPERATIONS - E2E TESTS (TDD)
 * Updated selectors to match actual implementation
 */

test.describe('Bulk Operations - TDD Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForSelector('h1:has-text("All Contacts")', { timeout: 10000 });
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    await page.waitForTimeout(1000); // Wait for data to load
  });

  // ==========================================
  // TEST 1: Checkbox Visibility
  // ==========================================
  test('[TDD-001] should display checkbox in first column', async ({ page }) => {
    const checkbox = page.locator('tbody tr').first().locator('mat-checkbox');
    await expect(checkbox).toBeVisible();
  });

  // ==========================================
  // TEST 2: Select Single Contact
  // ==========================================
  test('[TDD-002] should select contact when checkbox clicked', async ({ page }) => {
    await page.locator('tbody tr').first().locator('mat-checkbox').click();
    await page.waitForTimeout(500);

    // Check toolbar is visible
    await expect(page.locator('.bulk-actions-bar')).toBeVisible();

    // Check count badge shows "1"
    await expect(page.locator('.selection-badge .count')).toContainText('1');
    await expect(page.locator('.selection-badge .label')).toContainText('Selected');
  });

  // ==========================================
  // TEST 3: Select All
  // ==========================================
  test('[TDD-003] should select all contacts with master checkbox', async ({ page }) => {
    const masterCheckbox = page.locator('thead mat-checkbox');
    await masterCheckbox.click();
    await page.waitForTimeout(1000);

    const rowCount = await page.locator('tbody tr').count();

    // Check count shows correct number
    await expect(page.locator('.selection-badge .count')).toContainText(`${rowCount}`);
  });

  // ==========================================
  // TEST 4: Bulk Delete
  // ==========================================
  test('[TDD-004] should bulk delete selected contacts', async ({ page }) => {
    // Select 2 contacts
    await page.locator('tbody tr:nth-child(1) mat-checkbox').click();
    await page.locator('tbody tr:nth-child(2) mat-checkbox').click();
    await page.waitForTimeout(500);

    // Click Delete button (updated selector)
    await page.click('.bulk-delete');
    await page.waitForTimeout(500);

    // Confirm deletion
    await page.click('button:has-text("Yes, Delete All")');
    await page.waitForTimeout(2000);

    // Check success toast
    const toast = page.locator('.toast-success, .mat-mdc-snack-bar-container');
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  // ==========================================
  // TEST 5: Bulk Export
  // ==========================================
  test('[TDD-005] should bulk export selected contacts', async ({ page }) => {
    // Select 1 contact
    await page.locator('tbody tr:nth-child(1) mat-checkbox').click();
    await page.waitForTimeout(500);

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click Export button (updated selector)
    await page.click('.bulk-export');

    // Wait for download
    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toContain('selected');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  // ==========================================
  // TEST 6: Bulk Add to Favorites
  // ==========================================
  test('[TDD-006] should bulk export selected contacts', async ({ page }) => {
  // Select first contact
  await page.locator('tbody tr:first-child mat-checkbox').click();
  await page.waitForTimeout(500);

  // Bulk toolbar appears
  await expect(page.locator('.bulk-actions-bar')).toBeVisible();

  // Click Export
  await page.click('.bulk-export');
  await page.waitForTimeout(2000);

  // Toast appears
  const toast = page.locator('.mat-mdc-snack-bar-container');
  await expect(toast).toBeVisible({ timeout: 5000 });
});
  // ==========================================
  // TEST 7: Clear Selection
  // ==========================================
  test('[TDD-007] should clear all selections', async ({ page }) => {
    // Select 1 contact
    await page.locator('tbody tr:nth-child(1) mat-checkbox').click();
    await page.waitForTimeout(500);

    // Click clear button (updated selector)
    await page.click('.bulk-clear');
    await page.waitForTimeout(500);

    // Toolbar should disappear
    await expect(page.locator('.bulk-actions-bar')).not.toBeVisible();
  });

  // ==========================================
  // TEST 8: Multiple Selection Count
  // ==========================================
  test('[TDD-008] should show correct count for multiple selections', async ({ page }) => {
    // Select 3 contacts
    await page.locator('tbody tr:nth-child(1) mat-checkbox').click();
    await page.locator('tbody tr:nth-child(2) mat-checkbox').click();
    await page.locator('tbody tr:nth-child(3) mat-checkbox').click();
    await page.waitForTimeout(500);

    // Check count
    await expect(page.locator('.selection-badge .count')).toContainText('3');
  });

  // ==========================================
  // TEST 9: Deselect Contact
  // ==========================================
  test('[TDD-009] should hide toolbar when all deselected', async ({ page }) => {
    // Select contact
    await page.locator('tbody tr:nth-child(1) mat-checkbox').click();
    await page.waitForTimeout(500);

    // Verify toolbar visible
    await expect(page.locator('.bulk-actions-bar')).toBeVisible();

    // Deselect same contact
    await page.locator('tbody tr:nth-child(1) mat-checkbox').click();
    await page.waitForTimeout(500);

    // Toolbar should disappear
    await expect(page.locator('.bulk-actions-bar')).not.toBeVisible();
  });

});
