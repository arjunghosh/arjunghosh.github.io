// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Acceptance criteria: every social icon shows its parent brand colour AT ALL
 * TIMES — softened at rest (lower opacity), full strength on hover — and on
 * hover the WHOLE tile brightens in the brand colour (brand border + glow).
 * - Glyph icons carry the brand colour directly (GitHub/X use a light colour
 *   since black is invisible on the purple bg; Instagram is a flat magenta,
 *   not a gradient).
 * - Flexilytics, Loyla and Scrum Alliance are self-hosted circular logo images
 *   (full colour, softened at rest → full on hover); about.me and Agile Network
 *   India are themed glyphs.
 *
 * CSS transitions are disabled in-test and hover is re-applied inside each poll
 * so assertions don't race the transition or a hover that didn't land.
 */

const GLYPH = [
  ['linkedin', 'rgb(46, 143, 224)'],
  ['github', 'rgb(240, 246, 252)'],
  ['x', 'rgb(255, 255, 255)'],
  ['instagram', 'rgb(228, 64, 95)'], // flat magenta, not a gradient
  ['facebook', 'rgb(66, 147, 251)'],
  ['aboutme', 'rgb(42, 163, 221)'],
  ['ani', 'rgb(245, 66, 46)'],
];

const LOGO = [
  ['flexilytics', 'assets/icon-flexilytics.png', 'rgb(59, 142, 240)'],
  ['loyla', 'assets/icon-loyla.png', 'rgb(34, 211, 238)'],
  ['scrumalliance', 'assets/icon-scrumalliance.png', 'rgb(245, 130, 32)'],
];

// Re-hover the link each iteration, then read `prop` off `target`, until match.
// Long timeout + short intervals make this robust to a hover that doesn't land
// on the first move under parallel load.
function hoverCss(page, linkSel, target, prop) {
  return expect.poll(
    async () => {
      await page.locator(linkSel).hover();
      return page.locator(target).evaluate((el, p) => getComputedStyle(el)[p], prop);
    },
    { timeout: 10000, intervals: [50, 100, 200, 400] }
  );
}

test.describe('AC-8 social brand colours (always-on, hover-bright)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
    await page.mouse.move(0, 0); // clear any stale hover before each test
  });

  for (const [slug, color] of GLYPH) {
    test(`${slug}: brand colour present at rest (softened) and full on hover`, async ({ page }) => {
      const glyph = page.locator(`.icon-link--${slug} i`);
      // Rest: brand colour already applied, but softened (opacity < 1).
      await expect(glyph).toHaveCSS('color', color);
      const restOpacity = Number(await glyph.evaluate((el) => getComputedStyle(el).opacity));
      expect(restOpacity).toBeLessThan(1);
      // Hover: full opacity + the tile takes the brand border colour.
      await hoverCss(page, `.icon-link--${slug}`, `.icon-link--${slug} i`, 'opacity').toBe('1');
      await hoverCss(page, `.icon-link--${slug}`, `.icon-link--${slug}`, 'borderColor').toBe(color);
    });
  }

  for (const [slug, src, color] of LOGO) {
    test(`${slug}: circular logo, softened at rest → full + brand tile on hover`, async ({ page }) => {
      const img = page.locator(`.icon-link--${slug} img.icon-logo`);
      await expect(img).toHaveCount(1);
      await expect(img).toHaveAttribute('src', src);
      await expect(img).toHaveCSS('border-radius', '50%');
      const restOpacity = Number(await img.evaluate((el) => getComputedStyle(el).opacity));
      expect(restOpacity).toBeLessThan(1);
      await hoverCss(page, `.icon-link--${slug}`, `.icon-link--${slug} img.icon-logo`, 'opacity').toBe('1');
      await hoverCss(page, `.icon-link--${slug}`, `.icon-link--${slug}`, 'borderColor').toBe(color);
    });
  }

  for (const [, src] of LOGO) {
    test(`${src} asset is served (HTTP 200, png)`, async ({ page }) => {
      const res = await page.request.get('/' + src);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('png');
    });
  }
});
