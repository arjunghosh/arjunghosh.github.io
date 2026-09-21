// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Acceptance criteria: the "Download Resume" button must point at the
 * latest resume PDF (docs/Arjun-Ghosh-September-2026-LinkedIn.pdf), open
 * in a new tab, and the target file must actually be served (HTTP 200,
 * application/pdf) — a href to a missing file passes an attribute-only
 * check but 404s for real users.
 */

const PDF_PATH = './docs/Arjun-Ghosh-September-2026-LinkedIn.pdf';

test.describe('AC-3 download resume button', () => {
  test('button points at the September 2026 LinkedIn PDF in a new tab', async ({ page }) => {
    await page.goto('/index.html');
    const link = page.locator('a.btn-premium-resume');
    await expect(link).toHaveAttribute('href', PDF_PATH);
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('the linked PDF is actually served (HTTP 200, pdf content-type)', async ({ page }) => {
    const res = await page.request.get('/docs/Arjun-Ghosh-September-2026-LinkedIn.pdf');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('pdf');
  });
});
