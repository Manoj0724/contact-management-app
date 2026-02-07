import { test, expect } from '@playwright/test';

test.describe('Advanced Search', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
    await page.click('button:has-text("Advanced Search")');
    await expect(page.locator('.modal-title:has-text("Advanced Search")')).toBeVisible();
  });

  test('should display advanced search modal with all fields', async ({ page }) => {
    await expect(page.locator('input[placeholder*="First Name"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Last Name"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Mobile"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="City"]')).toBeVisible();
  });

  test('should show validation error for invalid mobile in search', async ({ page }) => {
    const mobileInput = page.locator('input[placeholder*="Mobile"]');
    await mobileInput.fill('123');
    await page.click('button:has-text("Apply Search")');

    await expect(page.locator('text=Please enter valid data')).toBeVisible();
  });

  test('should close modal when clicking Cancel', async ({ page }) => {
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('.modal-title:has-text("Advanced Search")')).not.toBeVisible();
  });

  test('should close modal when clicking X button', async ({ page }) => {
    await page.click('.btn-close');
    await expect(page.locator('.modal-title:has-text("Advanced Search")')).not.toBeVisible();
  });
});
