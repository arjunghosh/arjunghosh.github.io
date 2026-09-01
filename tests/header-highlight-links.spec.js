// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Acceptance criteria: "Flexilytics.ai" and "Loyla.ai" in the header
 * subtitle must be real links (new-tab, correct URLs) but must not look
 * like default browser links at rest — only reveal link affordance on
 * hover/focus. Color must stay the existing --color-cyan highlight, not
 * the browser default link blue, and no underline until hover.
 */

test.describe('AC-2 header entity links', () => {
  test('Flexilytics.ai links to flexilytics site in a new tab', async ({ page }) => {
    await page.goto('/index.html');
    const link = page.locator('h2 a', { hasText: 'Flexilytics.ai' });
    await expect(link).toHaveAttribute('href', 'https://www.flexilytics.ai/');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  });

  test('Loyla.ai links to loyla site in a new tab', async ({ page }) => {
    await page.goto('/index.html');
    const link = page.locator('h2 a', { hasText: 'Loyla.ai' });
    await expect(link).toHaveAttribute('href', 'https://www.loyla.ai/');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  });

  test('links keep the highlight cyan color, not default link-blue, at rest', async ({ page }) => {
    await page.goto('/index.html');
    const link = page.locator('h2 a', { hasText: 'Flexilytics.ai' });
    const color = await link.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(86, 204, 242)'); // --color-cyan
    const decoration = await link.evaluate((el) => getComputedStyle(el).textDecorationLine);
    expect(decoration).toBe('none');
  });

  test('links show underline affordance on hover', async ({ page }) => {
    await page.goto('/index.html');
    const link = page.locator('h2 a', { hasText: 'Loyla.ai' });
    await link.hover();
    const decoration = await link.evaluate((el) => getComputedStyle(el).textDecorationLine);
    expect(decoration).toBe('underline');
  });
});
