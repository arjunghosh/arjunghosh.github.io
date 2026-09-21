// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Acceptance criteria: each social icon reveals its parent brand on hover.
 * - Font Awesome brand/description glyphs: grey at rest → brand colour on hover
 *   (GitHub/X use a light substitute since black is invisible on the purple bg;
 *   Instagram uses the real multicolour gradient).
 * - The 5 previously-generic entries now show real brand marks: Flexilytics,
 *   Loyla and Scrum Alliance as self-hosted circular logo images (grayscale at
 *   rest → full colour on hover); about.me as a fitting glyph; Agile Network
 *   India as a themed glyph in its red.
 *
 * CSS transitions are disabled in-test and hover is re-applied inside each poll
 * so assertions never race the transition or a hover that didn't land.
 */

const GLYPH_HOVER = [
  ['linkedin', 'rgb(10, 102, 194)'],   // #0A66C2
  ['github', 'rgb(240, 246, 252)'],    // #F0F6FC (light substitute)
  ['x', 'rgb(255, 255, 255)'],         // #FFFFFF (light substitute)
  ['facebook', 'rgb(24, 119, 242)'],   // #1877F2
  ['aboutme', 'rgb(8, 114, 180)'],     // #0872B4
  ['ani', 'rgb(245, 66, 46)'],         // #F5422E
];

const LOGO_ICONS = [
  ['flexilytics', 'assets/icon-flexilytics.png'],
  ['loyla', 'assets/icon-loyla.png'],
  ['scrumalliance', 'assets/icon-scrumalliance.png'],
];

// Re-hover the link each iteration, then read `prop` off `target`, until it
// matches — robust against a hover that didn't land on the first move.
function hoverCss(page, linkSel, target, prop) {
  return expect
    .poll(async () => {
      await page.locator(linkSel).hover();
      return page.locator(target).evaluate((el, p) => getComputedStyle(el)[p], prop);
    });
}

test.describe('AC-8 social brand hover reveal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
  });

  for (const [slug, color] of GLYPH_HOVER) {
    test(`${slug} glyph turns brand colour on hover`, async ({ page }) => {
      await hoverCss(page, `.icon-link--${slug}`, `.icon-link--${slug} i`, 'color').toBe(color);
    });
  }

  test('instagram uses a multicolour gradient on hover', async ({ page }) => {
    await hoverCss(page, '.icon-link--instagram', '.icon-link--instagram i', 'backgroundImage').toContain('gradient');
    await hoverCss(page, '.icon-link--instagram', '.icon-link--instagram i', 'webkitTextFillColor')
      .toBe('rgba(0, 0, 0, 0)'); // transparent → gradient shows through
  });

  for (const [slug, src] of LOGO_ICONS) {
    test(`${slug} shows a circular logo image, greyscale→colour on hover`, async ({ page }) => {
      const img = page.locator(`.icon-link--${slug} img.icon-logo`);
      await expect(img).toHaveCount(1);
      await expect(img).toHaveAttribute('src', src);
      await expect(img).toHaveCSS('border-radius', '50%');
      await expect(img).toHaveCSS('filter', 'grayscale(1) opacity(0.6)'); // muted at rest
      await hoverCss(page, `.icon-link--${slug}`, `.icon-link--${slug} img.icon-logo`, 'filter')
        .toBe('grayscale(0) opacity(1)'); // full colour on hover
    });
  }

  for (const [, src] of LOGO_ICONS) {
    test(`${src} asset is served (HTTP 200, png)`, async ({ page }) => {
      const res = await page.request.get('/' + src);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('png');
    });
  }
});
