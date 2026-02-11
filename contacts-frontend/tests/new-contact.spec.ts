import { test, expect } from '@playwright/test';

test.describe('Create New Contact', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('form').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display new contact form with all fields', async ({ page }) => {
    await expect(page.locator('mat-select[name="title"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="mobile1"]')).toBeVisible();
    await expect(page.locator('input[name="mobile2"]')).toBeVisible();
    await expect(page.locator('input[name="city"]')).toBeVisible();
    await expect(page.locator('input[name="state"]')).toBeVisible();
    await expect(page.locator('input[name="pincode"]')).toBeVisible();
  });

  test('should have Save button disabled when form is empty', async ({ page }) => {
    const saveBtn = page.locator('button').filter({ hasText: /Save/i });
    await expect(saveBtn).toBeDisabled();
  });

  test('should show validation error for empty required field', async ({ page }) => {
    // Type something then clear to trigger touched + dirty state
    const firstNameInput = page.locator('input[name="firstName"]');
    await firstNameInput.click();
    await firstNameInput.fill('a');
    await firstNameInput.selectText();
    await firstNameInput.press('Backspace');
    await firstNameInput.blur();
    await page.waitForTimeout(300);
    // mat-error should appear
    await expect(page.locator('mat-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('should show error for numbers in name field', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John123');
    await page.locator('input[name="firstName"]').blur();
    await page.waitForTimeout(300);
    await expect(page.locator('mat-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('should show error for short mobile number', async ({ page }) => {
    await page.fill('input[name="mobile1"]', '123');
    await page.locator('input[name="mobile1"]').blur();
    await page.waitForTimeout(300);
    await expect(page.locator('mat-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('should show error for short pincode', async ({ page }) => {
    await page.fill('input[name="pincode"]', '123');
    await page.locator('input[name="pincode"]').blur();
    await page.waitForTimeout(300);
    await expect(page.locator('mat-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('should enable Save button when all required fields are valid', async ({ page }) => {
    // Fill all required fields with valid data
    await page.locator('mat-select[name="title"]').click();
    await page.locator('mat-option').filter({ hasText: 'Mr' }).first().click();

    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="mobile1"]', '9876543210');
    await page.fill('input[name="city"]', 'Mumbai');
    await page.fill('input[name="state"]', 'Maharashtra');
    await page.fill('input[name="pincode"]', '400001');

    // Click elsewhere to trigger validation
    await page.locator('body').click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    await expect(
      page.locator('button').filter({ hasText: /Save/i })
    ).toBeEnabled({ timeout: 5000 });
  });

  test('should successfully create a new contact and redirect', async ({ page }) => {
    await page.locator('mat-select[name="title"]').click();
    await page.locator('mat-option').filter({ hasText: 'Mr' }).first().click();

    await page.fill('input[name="firstName"]', 'Playwright');
    await page.fill('input[name="lastName"]', 'Tester');
    await page.fill('input[name="mobile1"]', '9876543210');
    await page.fill('input[name="mobile2"]', '9876543211');
    await page.fill('input[name="city"]', 'Bangalore');
    await page.fill('input[name="state"]', 'Karnataka');
    await page.fill('input[name="pincode"]', '560001');

    await page.locator('body').click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const saveBtn = page.locator('button').filter({ hasText: /Save/i });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Should navigate to contacts list
    await expect(page).toHaveURL('/contacts', { timeout: 10000 });
  });

  test('should cancel and return to contacts list', async ({ page }) => {
    await page.locator('button').filter({ hasText: /Cancel/i }).click();
    await expect(page).toHaveURL('/contacts', { timeout: 5000 });
  });

});
