// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Acceptance criteria: the favicon must be ROUND (circular), matching the
 * circular portrait images on the page — not a square. Since a favicon is a
 * raster file (CSS border-radius can't apply), roundness = a circular alpha
 * mask baked into the PNG: transparent corners, opaque centre. Verified by
 * decoding the PNG into a canvas and sampling pixel alpha.
 */

async function cornerAndCenterAlpha(page, url) {
  return page.evaluate(
    (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const corner = ctx.getImageData(0, 0, 1, 1).data[3];
          const center = ctx.getImageData(
            Math.floor(c.width / 2),
            Math.floor(c.height / 2),
            1,
            1
          ).data[3];
          resolve({ corner, center });
        };
        img.onerror = reject;
        img.src = src;
      }),
    url
  );
}

test.describe('AC-7 rounded (circular) favicon', () => {
  for (const size of [16, 32, 180]) {
    test(`favicon-${size}.png has transparent corners and an opaque centre`, async ({ page }) => {
      await page.goto('/index.html');
      const { corner, center } = await cornerAndCenterAlpha(page, `/assets/favicon-${size}.png`);
      expect(corner).toBe(0); // circular mask → corner clipped away
      expect(center).toBe(255); // centre fully opaque
    });
  }
});
