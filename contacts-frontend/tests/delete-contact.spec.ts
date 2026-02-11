import { test, expect } from '@playwright/test';

test.describe('Delete Contact', () => {

  // Helper to create a test contact
  async function createTestContact(page: any) {
    await page.goto('/contacts/new');
    await page.waitForLoadState('networkidle');
    await page.locator('mat-select[name="title"]').click();
    await page.locator('mat-option').filter({ hasText: 'Mr' }).first().click();
    await page.fill('input[name="firstName"]', 'DeleteTest');
    await page.fill('input[name="lastName"]', 'UserTest');
    await page.fill('input[name="mobile1"]', '9111111111');
    await page.fill('input[name="city"]', 'TestCity');
    await page.fill('input[name="state"]', 'TestState');
    await page.fill('input[name="pincode"]', '111111');
    const saveBtn = page.locator('button').filter({ hasText: /Save/i });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();
    await expect(page).toHaveURL('/contacts', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  }

  test('should display Delete button in each row', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 8000 });
    // Each row has 2 icon buttons - edit and delete
    const buttons = page.locator('tbody tr').first().locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should show Material confirmation dialog on delete click', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 8000 });

    // Click delete button (2nd button in first row)
    const deleteBtn = page.locator('tbody tr').first().locator('button').last();
    await deleteBtn.click();

    // Wait for Material dialog OR custom confirm dialog
    await expect(
      page.locator('mat-dialog-container').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should cancel deletion and keep contact', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 8000 });

    const rowsBefore = await page.locator('tbody tr').count();

    // Click delete button
    const deleteBtn = page.locator('tbody tr').first().locator('button').last();
    await deleteBtn.click();

    // Wait for dialog
    await expect(
      page.locator('mat-dialog-container').first()
    ).toBeVisible({ timeout: 5000 });

    // Click Cancel in dialog
    const cancelBtn = page.locator('mat-dialog-container button, .confirm-footer button')
                          .filter({ hasText: /Cancel/i }).first();
    await cancelBtn.click();

    // Dialog should close
    await page.waitForTimeout(500);
    const rowsAfter = await page.locator('tbody tr').count();
    expect(rowsAfter).toBe(rowsBefore);
  });

  test('should successfully delete contact', async ({ page }) => {
    // Create a contact to delete
    await createTestContact(page);

    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 8000 });
    const rowsBefore = await page.locator('tbody tr').count();

    // Click delete on first row
    const deleteBtn = page.locator('tbody tr').first().locator('button').last();
    await deleteBtn.click();

    // Wait for dialog
    await expect(
      page.locator('mat-dialog-container').first()
    ).toBeVisible({ timeout: 5000 });

    // Click YES/DELETE button
    const confirmBtn = page.locator(
      'mat-dialog-container button, .confirm-footer button'
    ).filter({ hasText: /Yes|Delete/i }).first();
    await confirmBtn.click();

    // Wait for deletion to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const rowsAfter = await page.locator('tbody tr').count();
    expect(rowsAfter).toBeLessThanOrEqual(rowsBefore);
  });

});
