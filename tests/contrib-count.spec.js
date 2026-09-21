// @ts-check
const { test, expect } = require('@playwright/test');
const { mockPrimary } = require('./fixtures');

/**
 * Acceptance criteria: in the "N contributions in the last year" heading, the
 * contribution COUNT must stand out — bold and a bright distinctive colour
 * (neon green #56d364, matching the graph), not the muted grey of the
 * surrounding sentence. The rest of the sentence stays muted.
 */

test.describe('AC-6 contribution count emphasis', () => {
  test('the count is wrapped in a bold, neon-green element', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');
    const count = page.locator('.github-graph-total .contrib-count');
    await expect(count).toHaveCount(1);
    // Non-empty numeric text (e.g. "1,668").
    await expect(count).toHaveText(/[0-9]/);
    const weight = await count.evaluate((el) => getComputedStyle(el).fontWeight);
    expect(Number(weight)).toBeGreaterThanOrEqual(700);
    const color = await count.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(86, 211, 100)'); // #56d364
  });

  test('the surrounding sentence stays muted (count colour differs)', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');
    const headingColor = await page
      .locator('.github-graph-total')
      .evaluate((el) => getComputedStyle(el).color);
    const countColor = await page
      .locator('.github-graph-total .contrib-count')
      .evaluate((el) => getComputedStyle(el).color);
    expect(countColor).not.toBe(headingColor);
    // Full-sentence text still reads naturally.
    await expect(page.locator('.github-graph-total')).toContainText('contributions in the last year');
  });
});
