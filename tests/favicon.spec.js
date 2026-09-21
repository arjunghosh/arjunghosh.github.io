// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Acceptance criteria (F2): the site must declare a favicon so browsers stop
 * requesting a missing /favicon.ico (404). Per branding decision the icon is
 * Arjun's self-hosted GitHub avatar (personal brand), NOT a hotlink and NOT a
 * sub-brand (Loyla) mark. Assert the <link> tags are wired to self-hosted
 * assets and that each icon file is actually served (HTTP 200, PNG).
 */

test.describe('AC-4 favicon (self-hosted GitHub avatar)', () => {
  test('head declares a 32px png icon and a 180px apple-touch icon', async ({ page }) => {
    await page.goto('/index.html');
    const icon = page.locator('link[rel="icon"][sizes="32x32"]');
    await expect(icon).toHaveAttribute('href', 'assets/favicon-32.png');
    await expect(icon).toHaveAttribute('type', 'image/png');
    const apple = page.locator('link[rel="apple-touch-icon"]');
    await expect(apple).toHaveAttribute('href', 'assets/favicon-180.png');
  });

  test('favicon is self-hosted, not a github.com hotlink', async ({ page }) => {
    await page.goto('/index.html');
    const hrefs = await page.locator('link[rel="icon"], link[rel="apple-touch-icon"]').evaluateAll(
      (els) => els.map((el) => el.getAttribute('href'))
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) expect(h).not.toMatch(/^https?:\/\//);
  });

  test('each favicon asset is served (HTTP 200, png)', async ({ page }) => {
    for (const size of [16, 32, 180]) {
      const res = await page.request.get(`/assets/favicon-${size}.png`);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('png');
    }
  });
});
