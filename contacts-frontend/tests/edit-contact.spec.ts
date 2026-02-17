import { test, expect } from '@playwright/test';

test('should navigate to edit contact page', async ({ page }) => {
  await page.goto('http://localhost:4200/contacts');

  // Wait for table to load
  await page.waitForSelector('tbody tr', { timeout: 10000 });

  // Click Edit button (it's the SECOND icon button - first is star, second is edit)
  const firstRow = page.locator('tbody tr').first();
  await firstRow.locator('button mat-icon:text("edit")').click();

  // Should navigate to edit page
  await expect(page).toHaveURL(/\/contacts\/edit\/[a-f0-9]+/, { timeout: 5000 });

  // Verify edit page loaded
  await expect(page.locator('h1:has-text("Edit Contact")')).toBeVisible();
});
