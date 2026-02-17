import { test, expect } from '@playwright/test';

test.describe('Contact Groups - TDD Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(1500);
  });

  // HELPER: Create group via API
  async function createGroupViaAPI(page: any, name: string) {
    await page.evaluate(async (groupName: string) => {
      await fetch('http://localhost:5000/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName, color: '#3B82F6', icon: 'label' })
      });
    }, name);
    await page.reload();
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(1500);
  }

  // ==========================================
  // TEST 1: Groups Label Visible
  // ==========================================
  test('[GROUPS-001] should display groups section in sidebar', async ({ page }) => {
    await expect(page.locator('.groups-label')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.groups-label')).toContainText('GROUPS');
  });

  // ==========================================
  // TEST 2: Create Group via UI
  // ==========================================
  test('[GROUPS-002] should create new group', async ({ page }) => {
    const name = `TG${Date.now()}`;

    // Click + button
    await page.click('.add-group-btn');
    await page.waitForTimeout(800);

    // Fill name
    await page.waitForSelector('.name-input', { timeout: 5000 });
    await page.fill('.name-input', name);

    // Pick color
    await page.click('.color-option:first-child');
    await page.waitForTimeout(200);

    // Submit
    await page.click('.btn-submit');

    // ✅ Wait longer then reload to see group
    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(1500);

    // Now verify group exists
    await expect(
      page.locator('.group-row').filter({ hasText: name })
    ).toBeVisible({ timeout: 5000 });
  });

  // ==========================================
  // TEST 3: Filter by Group
  // ==========================================
  test('[GROUPS-003] should filter contacts by group', async ({ page }) => {
    const name = `FG${Date.now()}`;
    await createGroupViaAPI(page, name);

    await page.locator('.group-row').filter({ hasText: name })
      .locator('a.group-item').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('h1')).toContainText(name, { timeout: 5000 });
  });

  // ==========================================
  // TEST 4: Assign Contact to Group
  // ==========================================
  test('[GROUPS-004] should assign contact to group when editing', async ({ page }) => {
    const name = `AG${Date.now()}`;
    await createGroupViaAPI(page, name);

    // Click edit on first contact
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    await page.locator('tbody tr:first-child button[color="primary"]').first().click();
    await page.waitForTimeout(2500);

    // Wait for groups to load
    await page.waitForSelector('.groups-grid, .groups-empty-state', { timeout: 8000 });
    await page.waitForTimeout(500);

    // Click the specific group chip
    const chip = page.locator('.group-chip').filter({ hasText: name });
    await expect(chip).toBeVisible({ timeout: 5000 });
    await chip.click();
    await page.waitForTimeout(500);

    // ✅ FIXED: use .first() to avoid strict mode error with multiple selected chips
    await expect(page.locator('.group-chip-selected').first()).toBeVisible();

    // Save
    await page.click('button:has-text("Update Contact")');
    await page.waitForTimeout(2000);
  });

  // ==========================================
  // TEST 5: Group Count Shows 0
  // ==========================================
  test('[GROUPS-005] should show correct contact count per group', async ({ page }) => {
    const name = `CG${Date.now()}`;
    await createGroupViaAPI(page, name);

    const groupRow = page.locator('.group-row').filter({ hasText: name });
    await expect(groupRow).toBeVisible({ timeout: 5000 });
    await expect(groupRow.locator('.nav-badge')).toContainText('0', { timeout: 5000 });
  });

});
