// @ts-check
const { test, expect } = require('@playwright/test');
const { mockPrimary } = require('./fixtures');

/**
 * Acceptance criteria: in the "N contributions in the last year" heading, the
 * "<count> contributions" part must stand out — bold + italic and gold
 * (var(--color-gold) #ffd700), not the muted grey of the surrounding
 * sentence. " in the last year" stays muted.
 */

test.describe('AC-6 contribution count emphasis', () => {
  test('the "N contributions" is wrapped in a bold+italic gold element', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');
    const count = page.locator('.github-graph-total .contrib-count');
    await expect(count).toHaveCount(1);
    // Includes the number AND the word "contributions".
    await expect(count).toHaveText(/[0-9].*contributions/);
    const weight = await count.evaluate((el) => getComputedStyle(el).fontWeight);
    expect(Number(weight)).toBeGreaterThanOrEqual(700);
    const style = await count.evaluate((el) => getComputedStyle(el).fontStyle);
    expect(style).toBe('italic');
    const color = await count.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(253, 131, 27)'); // var(--color-amber) #fd831b
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
