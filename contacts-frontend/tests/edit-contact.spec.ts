import { test, expect } from '@playwright/test';

test.describe('Edit Contact', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForSelector('table');

    // Click the first Edit button
    await page.click('tbody tr:first-child button:has-text("Edit")');
    await expect(page.locator('h5:has-text("Edit Contact")')).toBeVisible();
  });

  test('should display edit form with all fields', async ({ page }) => {
    await expect(page.locator('select[name="title"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="mobile1"]')).toBeVisible();
    await expect(page.locator('input[name="city"]')).toBeVisible();
    await expect(page.locator('input[name="state"]')).toBeVisible();
    await expect(page.locator('input[name="pincode"]')).toBeVisible();
    await expect(page.locator('button:has-text("Update Contact")')).toBeVisible();
  });

  test('should load existing contact data', async ({ page }) => {
    const firstName = page.locator('input[name="firstName"]');
    const lastName = page.locator('input[name="lastName"]');
    const mobile = page.locator('input[name="mobile1"]');

    await expect(firstName).not.toHaveValue('');
    await expect(lastName).not.toHaveValue('');
    await expect(mobile).not.toHaveValue('');
  });

  test('should show validation error when clearing first name', async ({ page }) => {
    const firstNameInput = page.locator('input[name="firstName"]');
    await firstNameInput.clear();
    await firstNameInput.blur();

    await expect(page.locator('text=First name is required')).toBeVisible();
    await expect(page.locator('button:has-text("Update Contact")')).toBeDisabled();
  });

  test('should show validation error for invalid mobile', async ({ page }) => {
    const mobileInput = page.locator('input[name="mobile1"]');
    await mobileInput.clear();
    await mobileInput.fill('123');
    await mobileInput.blur();

    await expect(page.locator('text=Must be exactly 10 digits')).toBeVisible();
    await expect(mobileInput).toHaveClass(/is-invalid/);
  });

  test('should show validation error for letters in name', async ({ page }) => {
    const firstNameInput = page.locator('input[name="firstName"]');
    await firstNameInput.clear();
    await firstNameInput.fill('Test123');
    await firstNameInput.blur();

    await expect(page.locator('text=Only letters allowed')).toBeVisible();
  });

 test('should successfully update contact', async ({ page }) => {
  await page.waitForTimeout(1000);

  // Just modify the first name slightly (add 'X' at the end)
  const firstNameInput = page.locator('input[name="firstName"]');
  await firstNameInput.click();
  await firstNameInput.press('End'); // Move cursor to end
  await page.keyboard.type('X'); // Add X at the end

  await page.waitForTimeout(1000);

  // Click update
  await page.click('button:has-text("Update Contact")');

  await page.waitForURL('/contacts', { timeout: 15000 });
  await expect(page.locator('h1:has-text("Contacts")')).toBeVisible();
});
  test('should cancel and return to contacts list', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'TempName');
    await page.click('button:has-text("Cancel")');

    await page.waitForURL('/contacts');
    await expect(page.locator('h1:has-text("Contacts")')).toBeVisible();
  });

  test('should validate mobile2 if provided', async ({ page }) => {
    const mobile2Input = page.locator('input[name="mobile2"]');
    await mobile2Input.clear();
    await mobile2Input.fill('123');
    await mobile2Input.blur();

    await expect(page.locator('text=Must be exactly 10 digits')).toBeVisible();
  });
});
