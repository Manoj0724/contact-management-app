import { test, expect } from '@playwright/test';

test.describe('Edit Contact', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });
    // Click first edit button in first row
    await page.locator('tbody tr').first().locator('button').first().click();
    await expect(page.locator('form').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display edit form with all fields', async ({ page }) => {
    await expect(page.locator('mat-select[name="title"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="mobile1"]')).toBeVisible();
    await expect(page.locator('input[name="city"]')).toBeVisible();
    await expect(page.locator('input[name="state"]')).toBeVisible();
    await expect(page.locator('input[name="pincode"]')).toBeVisible();
  });

  test('should load existing contact data into fields', async ({ page }) => {
    // Fields should be pre-filled
    const firstName = await page.inputValue('input[name="firstName"]');
    expect(firstName.length).toBeGreaterThan(0);
    const mobile = await page.inputValue('input[name="mobile1"]');
    expect(mobile.length).toBeGreaterThan(0);
  });

  test('should show error for invalid mobile', async ({ page }) => {
    await page.fill('input[name="mobile1"]', '123');
    await page.locator('input[name="mobile1"]').blur();
    await page.waitForTimeout(300);
    await expect(page.locator('mat-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('should show error for numbers in name', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John123');
    await page.locator('input[name="firstName"]').blur();
    await page.waitForTimeout(300);
    await expect(page.locator('mat-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('should cancel and return to contacts list', async ({ page }) => {
    await page.locator('button').filter({ hasText: /Cancel/i }).click();
    await expect(page).toHaveURL('/contacts', { timeout: 5000 });
  });

  test('should successfully update contact', async ({ page }) => {
    // Update city field
    await page.fill('input[name="city"]', 'Mumbai');
    await page.locator('input[name="city"]').blur();
    await page.waitForTimeout(300);

    const updateBtn = page.locator('button').filter({ hasText: /Update/i });
    await expect(updateBtn).toBeEnabled({ timeout: 3000 });
    await updateBtn.click();

    await expect(page).toHaveURL('/contacts', { timeout: 10000 });
  });

});
