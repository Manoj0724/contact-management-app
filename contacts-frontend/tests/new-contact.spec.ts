import { test, expect } from '@playwright/test';

test.describe('Create New Contact', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
    await page.click('button:has-text("New Contact")');
    await expect(page.locator('h5:has-text("Add New Contact")')).toBeVisible();
  });

  test('should display new contact form with all fields', async ({ page }) => {
    await expect(page.locator('select[name="title"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="mobile1"]')).toBeVisible();
    await expect(page.locator('input[name="mobile2"]')).toBeVisible();
    await expect(page.locator('input[name="city"]')).toBeVisible();
    await expect(page.locator('input[name="state"]')).toBeVisible();
    await expect(page.locator('input[name="pincode"]')).toBeVisible();
    await expect(page.locator('button:has-text("Save Contact")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('should have Save button disabled initially', async ({ page }) => {
    const saveButton = page.locator('button:has-text("Save Contact")');
    await expect(saveButton).toBeDisabled();
  });

  test('should show validation error for empty first name', async ({ page }) => {
    const firstNameInput = page.locator('input[name="firstName"]');
    await firstNameInput.click();
    await firstNameInput.blur();
    await expect(page.locator('text=First name is required')).toBeVisible();
  });

  test('should show validation error for invalid mobile number - less than 10 digits', async ({ page }) => {
    const mobileInput = page.locator('input[name="mobile1"]');
    await mobileInput.fill('123');
    await mobileInput.blur();
    await expect(page.locator('text=Must be exactly 10 digits')).toBeVisible();
    await expect(mobileInput).toHaveClass(/is-invalid/);
  });

  test('should show validation error for letters in mobile number', async ({ page }) => {
    const mobileInput = page.locator('input[name="mobile1"]');
    await mobileInput.fill('abc1234567');
    await mobileInput.blur();
    await expect(page.locator('text=Must be exactly 10 digits')).toBeVisible();
  });

  test('should show validation error for numbers in first name', async ({ page }) => {
    const firstNameInput = page.locator('input[name="firstName"]');
    await firstNameInput.fill('John123');
    await firstNameInput.blur();
    await expect(page.locator('text=Only letters allowed')).toBeVisible();
  });

  test('should show validation error for invalid pincode - less than 6 digits', async ({ page }) => {
    const pincodeInput = page.locator('input[name="pincode"]');
    await pincodeInput.fill('123');
    await pincodeInput.blur();
    await expect(page.locator('text=Must be exactly 6 digits')).toBeVisible();
  });

  test('should enforce maxlength on mobile field', async ({ page }) => {
    const mobileInput = page.locator('input[name="mobile1"]');
    await mobileInput.fill('12345678901234567890');
    const value = await mobileInput.inputValue();
    expect(value.length).toBe(10);
  });

  test('should enforce maxlength on pincode field', async ({ page }) => {
    const pincodeInput = page.locator('input[name="pincode"]');
    await pincodeInput.fill('123456789');
    const value = await pincodeInput.inputValue();
    expect(value.length).toBe(6);
  });

  test('should allow mobile2 to be empty (optional)', async ({ page }) => {
    await page.selectOption('select[name="title"]', 'Mr');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="mobile1"]', '9876543210');
    await page.fill('input[name="city"]', 'TestCity');
    await page.fill('input[name="state"]', 'TestState');
    await page.fill('input[name="pincode"]', '123456');

    const saveButton = page.locator('button:has-text("Save Contact")');
    await expect(saveButton).toBeEnabled();
  });

 test('should successfully create a new contact', async ({ page }) => {
  // Use letters-only name (no timestamp with numbers!)
  const uniqueName = `TestUser${Math.random().toString(36).substring(7)}`;

  await page.selectOption('select[name="title"]', 'Mr');
  await page.fill('input[name="firstName"]', 'PlaywrightTest'); // ← Letters only!
  await page.fill('input[name="lastName"]', 'AutoTest');        // ← Letters only!
  await page.fill('input[name="mobile1"]', '9876543210');
  await page.fill('input[name="mobile2"]', '9876543211');
  await page.fill('input[name="city"]', 'Bangalore');           // ← Letters only!
  await page.fill('input[name="state"]', 'Karnataka');          // ← Letters only!
  await page.fill('input[name="pincode"]', '560001');

  // Wait for form validation to complete
  await page.waitForTimeout(500);

  const saveButton = page.locator('button:has-text("Save Contact")');
  await expect(saveButton).toBeEnabled();

  await saveButton.click();

  await page.waitForURL('/contacts', { timeout: 10000 });
  await expect(page.locator('h1:has-text("Contacts")')).toBeVisible();
});
  test('should cancel and return to contacts list', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'Test');
    await page.click('button:has-text("Cancel")');

    await page.waitForURL('/contacts');
    await expect(page.locator('h1:has-text("Contacts")')).toBeVisible();
  });

  test('should navigate back using back button', async ({ page }) => {
    await page.click('.btn-light:has-text("Back")');
    await page.waitForURL('/contacts');
    await expect(page.locator('h1:has-text("Contacts")')).toBeVisible();
  });
});
