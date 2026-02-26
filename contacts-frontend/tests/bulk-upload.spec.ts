
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Bulk Upload - TDD Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts/bulk-upload');
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  // ==========================================
  // [TDD-BULK-001] Page loads
  // ==========================================
  test('[TDD-BULK-001] should display bulk upload page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Bulk Upload');
    await expect(page.locator('.drop-zone')).toBeVisible();
    await expect(page.locator('.template-btn')).toBeVisible();
  });

  // ==========================================
  // [TDD-BULK-002] Template download
  // ==========================================
  test('[TDD-BULK-002] should download CSV template', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('.template-btn');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('contacts-template.csv');
  });

  // ==========================================
  // [TDD-BULK-003] Manual entry mode
  // ==========================================
  test('[TDD-BULK-003] should show manual entry table', async ({ page }) => {
    await page.click('.manual-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('.preview-table')).toBeVisible();
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(5);
  });

  // ==========================================
  // [TDD-BULK-004] Add row
  // ==========================================
  test('[TDD-BULK-004] should add new row', async ({ page }) => {
    await page.click('.manual-btn');
    await page.waitForTimeout(500);
    const initialRows = await page.locator('tbody tr').count();
    await page.click('.btn-add-row');
    await page.waitForTimeout(300);
    const newRows = await page.locator('tbody tr').count();
    expect(newRows).toBe(initialRows + 1);
  });

  // ==========================================
  // [TDD-BULK-005] Remove row
  // ==========================================
  test('[TDD-BULK-005] should remove row', async ({ page }) => {
    await page.click('.manual-btn');
    await page.waitForTimeout(500);
    const initialRows = await page.locator('tbody tr').count();
    await page.locator('.delete-row-btn').first().click();
    await page.waitForTimeout(300);
    const newRows = await page.locator('tbody tr').count();
    expect(newRows).toBe(initialRows - 1);
  });

  // ==========================================
  // [TDD-BULK-006] Upload manually
  // ==========================================
  test('[TDD-BULK-006] should upload manually entered contacts', async ({ page }) => {
    await page.click('.manual-btn');
    await page.waitForTimeout(500);

    // Fill first row
    await page.locator('tbody tr:first-child .cell-select').selectOption('Mr');
    await page.locator('tbody tr:first-child input').nth(0).fill('Test');
    await page.locator('tbody tr:first-child input').nth(1).fill('User');
    await page.locator('tbody tr:first-child input').nth(2).fill('9876543210');
    await page.locator('tbody tr:first-child input').nth(4).fill('Mumbai');
    await page.locator('tbody tr:first-child input').nth(5).fill('Maharashtra');
    await page.locator('tbody tr:first-child input').nth(6).fill('400001');

    await page.click('.btn-upload');
    await page.waitForTimeout(3000);
    await expect(page.locator('.result-banner')).toBeVisible({ timeout: 8000 });
  });

  // ==========================================
  // [TDD-BULK-007] CSV upload
  // ==========================================
 test('[TDD-BULK-007] should upload from CSV', async ({ page }) => {
  // Create simple CSV
  const csvContent = `title,firstName,lastName,mobile1,mobile2,city,state,pincode
Mr,CSVTest,User,8765432109,,Delhi,Delhi,110001`;

  // Use absolute path that definitely works
  const testDir = path.resolve(process.cwd(), 'tests');
  const csvPath = path.join(testDir, 'bulk-test.csv');

  // Ensure tests directory exists
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // Write CSV file
  fs.writeFileSync(csvPath, csvContent, 'utf-8');

  try {
    // Select file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);

    // Wait for processing
    await page.waitForTimeout(4000);

    // Check for error message first
    const hasError = await page.locator('.parse-error').isVisible().catch(() => false);
    if (hasError) {
      const errorMsg = await page.locator('.parse-error').textContent();
      console.log('Parse error:', errorMsg);
    }

    // Verify preview appeared (try both selectors)
    const previewVisible = await page.locator('.preview-table').isVisible().catch(() => false);

    if (previewVisible) {
      await expect(page.locator('.preview-table')).toBeVisible();
      const rowCount = await page.locator('tbody tr').count();
      expect(rowCount).toBeGreaterThanOrEqual(1);

      // Upload
      await page.click('.btn-upload');
      await page.waitForTimeout(4000);

      // Check results
      await expect(page.locator('.result-banner')).toBeVisible({ timeout: 10000 });
    } else {
      // If preview didn't appear, take screenshot and fail with helpful message
      await page.screenshot({ path: 'test-results/csv-upload-failed.png' });
      throw new Error('Preview page did not appear. Check screenshot at test-results/csv-upload-failed.png');
    }

  } finally {
    // Cleanup
    if (fs.existsSync(csvPath)) {
      fs.unlinkSync(csvPath);
    }
  }
});
  // ==========================================
  // [TDD-BULK-008] Error handling
  // ==========================================
  test('[TDD-BULK-008] should show error for invalid data', async ({ page }) => {
    await page.click('.manual-btn');
    await page.waitForTimeout(500);

    await page.locator('tbody tr:first-child .cell-select').selectOption('Mr');
    await page.locator('tbody tr:first-child input').nth(0).fill('Bad');
    await page.locator('tbody tr:first-child input').nth(1).fill('Data');
    await page.locator('tbody tr:first-child input').nth(2).fill('123'); // Invalid
    await page.locator('tbody tr:first-child input').nth(4).fill('Mumbai');
    await page.locator('tbody tr:first-child input').nth(5).fill('Maharashtra');
    await page.locator('tbody tr:first-child input').nth(6).fill('400001');

    await page.click('.btn-upload');
    await page.waitForTimeout(3000);
    await expect(page.locator('.error-list')).toBeVisible({ timeout: 8000 });
  });

  // ==========================================
  // [TDD-BULK-009] Back navigation
  // ==========================================
  test('[TDD-BULK-009] should navigate back', async ({ page }) => {
    await page.click('.back-btn');
    await expect(page).toHaveURL('/contacts');
  });

  // ==========================================
  // [TDD-BULK-010] Reset
  // ==========================================
  test('[TDD-BULK-010] should reset form', async ({ page }) => {
    await page.click('.manual-btn');
    await page.waitForTimeout(500);
    await page.locator('tbody tr:first-child input').nth(0).fill('Test');
    await page.click('.btn-secondary');
    await page.waitForTimeout(500);
    await expect(page.locator('.drop-zone')).toBeVisible();
  });

});
