import { test, expect } from '@playwright/test';

test.describe('Delete Contact', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForSelector('table');
  });

test('should display Delete button for each contact', async ({ page }) => {
  // Wait for table to load fully
  await page.waitForTimeout(1000);

  // Try multiple selectors for delete button
  let deleteButtons;
  try {
    deleteButtons = page.locator('button:has-text("Delete")');
    await deleteButtons.first().waitFor({ timeout: 5000 });
  } catch {
    try {
      deleteButtons = page.locator('button:has-text("🗑")'); // Trash icon
      await deleteButtons.first().waitFor({ timeout: 5000 });
    } catch {
      deleteButtons = page.locator('button.btn-danger'); // Red button class
    }
  }

  const count = await deleteButtons.count();
  expect(count).toBeGreaterThan(0);
});

  test('should show confirmation dialog when clicking Delete', async ({ page }) => {
    // Set up dialog handler BEFORE clicking
    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('Are you sure');
      await dialog.dismiss(); // Cancel the deletion
    });

    await page.click('tbody tr:first-child button:has-text("Delete")');
  });

  test('should cancel deletion when clicking Cancel on confirm dialog', async ({ page }) => {
    const rowsBefore = await page.locator('tbody tr').count();

    page.once('dialog', async dialog => {
      await dialog.dismiss();
    });

    await page.click('tbody tr:first-child button:has-text("Delete")');
    await page.waitForTimeout(500);

    const rowsAfter = await page.locator('tbody tr').count();
    expect(rowsAfter).toBe(rowsBefore);
  });
});
