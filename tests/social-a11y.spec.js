// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Acceptance criteria (F1): every social/venture/credential icon link is
 * icon-only, so it must expose a non-empty accessible name for screen-reader
 * users (title alone is unreliable). Assert each link resolves by its
 * accessible name (aria-label) and that the decorative glyph is hidden from
 * the accessibility tree.
 */

const EXPECTED = [
  'LinkedIn',
  'GitHub',
  'Flexilytics.ai',
  'Loyla.ai',
  'X (Twitter)',
  'Instagram',
  'Facebook',
  'About.me',
  'Scrum Alliance',
  'Agile Network India',
];

test.describe('AC-5 social icon-link accessibility', () => {
  test('every icon link resolves by an accessible name', async ({ page }) => {
    await page.goto('/index.html');
    for (const name of EXPECTED) {
      await expect(
        page.locator('.social-icons-row').getByRole('link', { name, exact: true })
      ).toHaveCount(1);
    }
  });

  test('no icon link has an empty accessible name', async ({ page }) => {
    await page.goto('/index.html');
    const labels = await page.locator('.social-icons-row a.icon-link').evaluateAll((els) =>
      els.map((el) => el.getAttribute('aria-label'))
    );
    expect(labels.length).toBe(EXPECTED.length);
    for (const l of labels) expect((l || '').trim().length).toBeGreaterThan(0);
  });

  test('decorative glyphs are hidden from the accessibility tree', async ({ page }) => {
    await page.goto('/index.html');
    const hidden = await page.locator('.social-icons-row a.icon-link i').evaluateAll((els) =>
      els.map((el) => el.getAttribute('aria-hidden'))
    );
    for (const h of hidden) expect(h).toBe('true');
  });
});
