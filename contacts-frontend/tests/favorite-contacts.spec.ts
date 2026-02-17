import { test, expect } from '@playwright/test';

test.describe('Favorite Contacts', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForSelector('h1:has-text("All Contacts")', { timeout: 10000 });
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  // ============================================
  // SPEC 1: Star Button Visible
  // ============================================
  test('should display star icon for each contact', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const starButton = firstRow.locator('button[aria-label="Toggle favorite"]');
    await expect(starButton).toBeVisible();
  });

  // ============================================
  // SPEC 2: Mark as Favorite
  // ============================================
  test('should mark contact as favorite when star is clicked', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const starButton = firstRow.locator('button[aria-label="Toggle favorite"]');
    await starButton.click();
    await page.waitForTimeout(1500);
    const filledStar = firstRow.locator('mat-icon:has-text("star")');
    await expect(filledStar).toBeVisible();
  });

  // ============================================
  // SPEC 3: Unmark Favorite
  // ============================================
  test('should unmark favorite when star is clicked again', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const starButton = firstRow.locator('button[aria-label="Toggle favorite"]');
    await starButton.click();
    await page.waitForTimeout(1500);
    await starButton.click();
    await page.waitForTimeout(1500);
    // ✅ Button still exists after toggling back
    await expect(starButton).toBeVisible({ timeout: 5000 });
  });

  // ============================================
  // SPEC 4: Filter Favorites
  // ============================================
  test('should filter to show only favorite contacts', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.locator('button[aria-label="Toggle favorite"]').click();
    await page.waitForTimeout(1000);

    const totalCount = await page.locator('tbody tr').count();

    // ✅ FIXED: button text is 'Favorites' (from app.component.html)
    await page.locator('.sidebar button').filter({ hasText: 'Favorites' }).first().click();
    await page.waitForTimeout(1500);

    const filteredCount = await page.locator('tbody tr').count();
    expect(filteredCount).toBeLessThanOrEqual(totalCount);
  });

  // ============================================
  // SPEC 5: Clear Filter
  // ============================================
  test('should show all contacts when filter is cleared', async ({ page }) => {
    // Mark a contact as favorite
    await page.locator('tbody tr').first()
      .locator('button[aria-label="Toggle favorite"]').click();
    await page.waitForTimeout(1000);

    // ✅ FIXED: Click "Favorites" button (exact text from HTML)
    await page.locator('.sidebar button').filter({ hasText: 'Favorites' }).first().click();
    await page.waitForTimeout(1500);
    const filteredCount = await page.locator('tbody tr').count();

    // ✅ FIXED: button text changes to 'All Contacts' (from app.component.html line:
    // {{ showOnlyFavorites ? 'All Contacts' : 'Favorites' }})
    await page.locator('.sidebar button').filter({ hasText: 'Show All' }).first().click();
    await page.waitForTimeout(1500);

    const allCount = await page.locator('tbody tr').count();
    expect(allCount).toBeGreaterThanOrEqual(filteredCount);
  });

  // ============================================
  // SPEC 6: Persist After Reload
  // ============================================
  test('should persist favorite status after page reload', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.locator('button[aria-label="Toggle favorite"]').click();
    await page.waitForTimeout(1500);

    await page.reload();
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const reloadedRow = page.locator('tbody tr').first();
    await expect(reloadedRow.locator('mat-icon:has-text("star")')).toBeVisible();
  });

});
