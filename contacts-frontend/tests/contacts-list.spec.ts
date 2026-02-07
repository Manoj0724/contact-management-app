import { test, expect } from '@playwright/test';

test.describe('Contacts List Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForSelector('h1:has-text("Contacts")');
  });

  test('should display contacts page with header', async ({ page }) => {
    await expect(page.locator('h1:has-text("Contacts")')).toBeVisible();
    await expect(page.locator('button:has-text("New Contact")')).toBeVisible();
  });

  test('should display contacts table', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("First Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Last Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Mobile")')).toBeVisible();
    await expect(page.locator('th:has-text("City")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('should show at least one contact in the table', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have Edit and Delete buttons for each contact', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.locator('button:has-text("Edit")')).toBeVisible();
    await expect(firstRow.locator('button:has-text("Delete")')).toBeVisible();
  });

  test('should navigate to New Contact page', async ({ page }) => {
    await page.click('button:has-text("New Contact")');
    await expect(page).toHaveURL('/contacts/new');
    await expect(page.locator('h5:has-text("Add New Contact")')).toBeVisible();
  });

  test('should search contacts', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search contacts..."]');
    await searchInput.fill('Test');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(1000);

    const clearButton = page.locator('button:has-text("Clear")');
    await expect(clearButton).toBeVisible();
  });

  test('should clear search', async ({ page }) => {
  const searchInput = page.locator('input[placeholder="Search contacts..."]');
  await searchInput.fill('Test');

  // Click the primary Search button (not Advanced Search)
  await page.click('button.btn-primary:has-text("Search")');
  await page.waitForTimeout(1000);

  // Wait for Clear button to be visible
  const clearButton = page.locator('button:has-text("Clear")');
  await clearButton.waitFor({ state: 'visible', timeout: 5000 });

  await clearButton.click();
  await page.waitForTimeout(500);

  // Verify the primary search button is back (not Advanced Search)
  await expect(page.locator('button.btn-primary:has-text("Search")')).toBeVisible();
});
  test('should change page size', async ({ page }) => {
    const pageSizeSelect = page.locator('select').first();
    await pageSizeSelect.selectOption('10');
    await page.waitForTimeout(1000);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(10);
  });

  test('should sort by first name', async ({ page }) => {
    const sortHeader = page.locator('th:has-text("First Name")');
    await sortHeader.click();
    await page.waitForTimeout(500);

    // Check if sort icon changed
    const sortIcon = page.locator('.bi-sort-alpha-down, .bi-sort-alpha-up');
    await expect(sortIcon).toBeVisible();
  });

 test('should export CSV', async ({ page }) => {
  // Set up download handler BEFORE clicking
  const downloadPromise = page.waitForEvent('download', { timeout: 15000 });

  // Click the CSV button (it has an icon, so be specific)
  await page.click('button:has-text("CSV")');

  // Wait for download
  const download = await downloadPromise;
  const filename = download.suggestedFilename();

  // Just check if it's a CSV file
  expect(filename).toContain('.csv');
});

  test('should open advanced search modal', async ({ page }) => {
    await page.click('button:has-text("Advanced Search")');
    await expect(page.locator('.modal-title:has-text("Advanced Search")')).toBeVisible();
  });

  test('should close advanced search modal', async ({ page }) => {
    await page.click('button:has-text("Advanced Search")');
    await expect(page.locator('.modal-title:has-text("Advanced Search")')).toBeVisible();

    await page.click('.btn-close');
    await expect(page.locator('.modal-title:has-text("Advanced Search")')).not.toBeVisible();
  });
});
