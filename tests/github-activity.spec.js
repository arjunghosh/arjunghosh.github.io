// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const {
  CONTRIBUTIONS,
  mockPrimary,
  killPrimary,
  mockFallbackImage,
  killFallbackImage,
} = require('./fixtures');

const GRAPH = '.github-graph';
const LOADING = /Loading GitHub Activity/i;

/**
 * Acceptance criteria trace back to the RCA of the 2026-08-04 outage:
 * github-calendar@latest fetched https://api.bloggify.net/gh-calendar/, that
 * origin returned HTTP 522, and the widget left "Loading GitHub Activity..."
 * on screen forever with no timeout, no fallback and no error state.
 */

test.describe('AC-1 contribution grid renders', () => {
  test('draws a full year of leveled day cells', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');

    const cells = page.locator(`${GRAPH} .ContributionCalendar-day`);
    await expect(cells.first()).toBeVisible();
    // A year of activity is 365+ days; allow for leading week padding.
    expect(await cells.count()).toBeGreaterThanOrEqual(360);
  });

  test('every cell carries a data-level in the 0-4 range', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');
    await expect(page.locator(`${GRAPH} .ContributionCalendar-day`).first()).toBeVisible();

    const levels = await page
      .locator(`${GRAPH} .ContributionCalendar-day`)
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-level')));

    expect(levels.length).toBeGreaterThan(0);
    for (const level of levels) {
      expect(['0', '1', '2', '3', '4']).toContain(level);
    }
    // Not a dead grid: at least one lit cell so the glow styling has a target.
    expect(levels.some((l) => l !== '0')).toBe(true);
  });

  test('renders as SVG so the existing glow CSS applies', async ({ page }) => {
    // style.css targets fill/stroke/text — those only work on SVG nodes.
    await mockPrimary(page);
    await page.goto('/index.html');

    const firstCell = page.locator(`${GRAPH} .ContributionCalendar-day`).first();
    await expect(firstCell).toBeVisible();
    const isSvg = await firstCell.evaluate((el) => el instanceof SVGElement);
    expect(isSvg).toBe(true);
  });
});

test.describe('AC-2 the loading placeholder never sticks', () => {
  test('clears once data arrives', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');
    await expect(page.locator(`${GRAPH} .ContributionCalendar-day`).first()).toBeVisible();
    await expect(page.locator(GRAPH)).not.toContainText(LOADING);
  });

  test('clears even when every data source is dead', async ({ page }) => {
    await killPrimary(page);
    await killFallbackImage(page);
    await page.goto('/index.html');

    // This is the exact bug: the widget must resolve to *something* fast.
    await expect(page.locator(GRAPH)).not.toContainText(LOADING, { timeout: 10000 });
  });
});

test.describe('AC-3 total contributions headline', () => {
  test('shows the last-year total from the API', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');

    const total = CONTRIBUTIONS.total.lastYear;
    const formatted = total.toLocaleString('en-US');
    await expect(page.locator(GRAPH)).toContainText(
      new RegExp(`${formatted}\\s+contributions in the last year`, 'i')
    );
  });
});

test.describe('AC-4 fallback when the primary source fails', () => {
  test('renders the fallback chart image', async ({ page }) => {
    await killPrimary(page);
    await mockFallbackImage(page);
    await page.goto('/index.html');

    const img = page.locator(`${GRAPH} img.github-graph-fallback`);
    await expect(img).toBeVisible({ timeout: 10000 });
    await expect(img).toHaveAttribute('src', /ghchart\.rshah\.org/);
    await expect(img).toHaveAttribute('alt', /.+/);
  });

  test('does not hang for anywhere near the 20s the dead proxy took', async ({ page }) => {
    await killPrimary(page);
    await mockFallbackImage(page);

    const started = Date.now();
    await page.goto('/index.html');
    await expect(page.locator(`${GRAPH} img.github-graph-fallback`)).toBeVisible({
      timeout: 10000,
    });
    expect(Date.now() - started).toBeLessThan(10000);
  });
});

test.describe('AC-5 graceful degradation when everything is down', () => {
  test('offers a link to the GitHub profile instead of a dead widget', async ({ page }) => {
    await killPrimary(page);
    await killFallbackImage(page);
    await page.goto('/index.html');

    const link = page.locator(`${GRAPH} a.github-graph-degraded`);
    await expect(link).toBeVisible({ timeout: 10000 });
    await expect(link).toHaveAttribute('href', 'https://github.com/arjunghosh');
    await expect(link).not.toBeEmpty();
  });
});

test.describe('AC-6 regression guards on the root causes', () => {
  const raw = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  // Comments document the outage on purpose, so they must not trip these guards.
  const html = raw.replace(/<!--[\s\S]*?-->/g, '');

  test('the dead bloggify proxy is gone', () => {
    expect(html).not.toContain('bloggify');
  });

  test('no unpinned @latest CDN dependency remains', () => {
    // "@latest" means a stranger's publish can break the live site silently.
    expect(html).not.toMatch(/@latest/);
  });

  test('the abandoned github-calendar widget is no longer loaded', () => {
    expect(html).not.toContain('github-calendar');
    expect(html).not.toContain('GitHubCalendar(');
  });

  test('every remaining third-party script/style is version-pinned', () => {
    const urls = [...html.matchAll(/(?:src|href)="(https:\/\/[^"]+)"/g)].map((m) => m[1]);
    const cdnUrls = urls.filter((u) => /unpkg\.com|cdnjs\.cloudflare\.com|jsdelivr/.test(u));
    for (const url of cdnUrls) {
      expect(url, `${url} must pin an explicit version`).toMatch(/\d+\.\d+\.\d+/);
    }
  });

  test('cross-origin script and style tags declare integrity or crossorigin', () => {
    const tags = [...html.matchAll(/<(script|link)\b[^>]*https:\/\/[^>]*>/g)].map((m) => m[0]);
    const remote = tags.filter((t) => /cdnjs|unpkg|jsdelivr/.test(t));
    for (const tag of remote) {
      expect(tag, `remote asset needs crossorigin/referrerpolicy hardening: ${tag}`).toMatch(
        /crossorigin=/
      );
    }
  });
});

/**
 * GitHub's dark-mode contribution palette, read from the live profile by
 * computing backgroundColor on [data-level] nodes under colorScheme: 'dark'.
 * Pinned here so the ramp cannot drift silently; re-verify against GitHub
 * before changing any of these values.
 */
const GH_DARK_GREENS = ['#033a16', '#196c2e', '#2ea043', '#56d364'];
const NEON_GREEN = GH_DARK_GREENS[3];

/**
 * Empty days use a translucent white veil rather than GitHub's near-black L0.
 * On this card's purple background a solid light L0 measures 7.50:1 while the
 * brightest green measures 4.38:1, which would make empty days outshine busy
 * ones. A 12% white sits at 1.35:1 and recedes behind every green.
 */
const EMPTY_FILL = '#ffffff';
const EMPTY_OPACITY = '0.12';

function expectedFill(level) {
  return level === 0 ? EMPTY_FILL : GH_DARK_GREENS[level - 1];
}

function expectedOpacity(level) {
  return level === 0 ? EMPTY_OPACITY : '1';
}

test.describe('AC-8 GitHub neon-green palette', () => {
  test('each level is filled with its pinned palette colour', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');
    await expect(page.locator(`${GRAPH} .ContributionCalendar-day`).first()).toBeVisible();

    const cells = await page
      .locator(`${GRAPH} .ContributionCalendar-day`)
      .evaluateAll((els) =>
        els.map((el) => ({
          level: Number(el.getAttribute('data-level')),
          fill: el.getAttribute('fill'),
          opacity: el.getAttribute('fill-opacity'),
        }))
      );

    const seen = new Set();
    for (const cell of cells) {
      expect(String(cell.fill).toLowerCase()).toBe(expectedFill(cell.level));
      expect(String(cell.opacity)).toBe(expectedOpacity(cell.level));
      seen.add(cell.level);
    }
    // The fixture spans all five levels, so all five must have been exercised.
    expect(seen.size).toBe(5);
  });

  test('empty days are a translucent white veil, not a black block', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');

    const empty = page.locator(`${GRAPH} .ContributionCalendar-day[data-level="0"]`).first();
    await expect(empty).toHaveAttribute('fill', EMPTY_FILL);
    await expect(empty).toHaveAttribute('fill-opacity', EMPTY_OPACITY);

    // The old near-black L0 must not come back.
    const fills = await page
      .locator(`${GRAPH} .ContributionCalendar-day`)
      .evaluateAll((els) => els.map((el) => String(el.getAttribute('fill')).toLowerCase()));
    expect(fills).not.toContain('#151b23');
  });

  test('the brightest level is the neon green, not the old cyan', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');
    const brightest = page.locator(`${GRAPH} .ContributionCalendar-day[data-level="4"]`).first();
    await expect(brightest).toHaveAttribute('fill', NEON_GREEN);
  });

  test('no cyan remains in the graph fills', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');
    const fills = await page
      .locator(`${GRAPH} .ContributionCalendar-day`)
      .evaluateAll((els) => els.map((el) => String(el.getAttribute('fill')).toLowerCase()));
    expect(fills.some((f) => f.includes('56ccf2') || f.includes('86, 204, 242'))).toBe(false);
  });

  test('the hover glow is green so the halo matches the cells', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
    const hoverRule = css.match(
      /\.ContributionCalendar-day\[data-level\]:not\(\[data-level="0"\]\):hover\s*\{[^}]*\}/
    );
    expect(hoverRule, 'hover rule must exist').not.toBeNull();
    expect(hoverRule[0]).toContain(NEON_GREEN);
    expect(hoverRule[0]).not.toContain('--color-cyan');
  });

  test('the fallback chart image uses the same green', async ({ page }) => {
    await killPrimary(page);
    await mockFallbackImage(page);
    await page.goto('/index.html');

    const img = page.locator(`${GRAPH} img.github-graph-fallback`);
    await expect(img).toBeVisible({ timeout: 10000 });
    await expect(img).toHaveAttribute('src', new RegExp(NEON_GREEN.slice(1)));
  });
});

test.describe('AC-9 contribution legend', () => {
  test('renders a Less -> More legend with all five swatches', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');

    const legend = page.locator(`${GRAPH} .github-graph-legend`);
    await expect(legend).toBeVisible();
    await expect(legend).toContainText(/Less/i);
    await expect(legend).toContainText(/More/i);

    const swatches = legend.locator('.github-graph-legend-swatch');
    expect(await swatches.count()).toBe(5);

    const fills = await swatches.evaluateAll((els) =>
      els.map((el) => String(el.getAttribute('fill')).toLowerCase())
    );
    expect(fills).toEqual([EMPTY_FILL, ...GH_DARK_GREENS]);
  });

  test('the legend is ordered least-to-most active', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');

    const xs = await page
      .locator(`${GRAPH} .github-graph-legend .github-graph-legend-swatch`)
      .evaluateAll((els) => els.map((el) => Number(el.getAttribute('x'))));
    expect(xs).toHaveLength(5); // guard: an empty list would sort "correctly"
    const sorted = [...xs].sort((a, b) => a - b);
    expect(xs).toEqual(sorted);
  });
});

/**
 * The left header portrait used to hotlink https://www.flexilytics.ai/assets/team/arjun.jpeg.
 * That asset started returning HTTP 403 (verified in a real browser, not just curl),
 * so the <img> decoded to 0x0 and rendered as stretched alt text. Same failure class
 * as the contribution-graph outage: a critical visual on someone else's infrastructure.
 * It is now served from this repo.
 */
const LOCAL_PORTRAIT = 'assets/arjun-ghosh.jpg';

test.describe('AC-10 header portraits', () => {
  test('both portraits actually decode', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');

    const imgs = page.locator('img.profile-img');
    expect(await imgs.count()).toBe(2);

    const dims = await imgs.evaluateAll((els) =>
      els.map((el) => ({ src: el.src, w: el.naturalWidth, h: el.naturalHeight }))
    );
    for (const d of dims) {
      expect(d.w, `${d.src} decoded to zero width`).toBeGreaterThan(0);
      expect(d.h, `${d.src} decoded to zero height`).toBeGreaterThan(0);
    }
  });

  test('the left portrait is served from this repo, not a third party', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');

    const left = page.locator('img.profile-img').first();
    await expect(left).toHaveAttribute('src', LOCAL_PORTRAIT);

    const { origin, natural } = await left.evaluate((el) => ({
      origin: new URL(el.src).origin,
      natural: el.naturalWidth,
    }));
    expect(origin).toBe(new URL(page.url()).origin);
    expect(natural).toBeGreaterThanOrEqual(256);
  });

  test('no header image points at flexilytics.ai any more', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const imgTags = html.match(/<img\b[^>]*>/g) || [];
    for (const tag of imgTags) {
      expect(tag, 'header images must not hotlink flexilytics.ai').not.toContain('flexilytics.ai');
    }
  });

  test('a broken portrait falls back instead of rendering stretched alt text', async ({ page }) => {
    await page.route(`**/${LOCAL_PORTRAIT}`, (route) => route.abort('failed'));
    await mockPrimary(page);
    await page.goto('/index.html');

    const left = page.locator('img.profile-img').first();
    await expect
      .poll(async () => left.evaluate((el) => el.naturalWidth), { timeout: 10000 })
      .toBeGreaterThan(0);
  });

  test('the committed portrait stays within a sane size budget', () => {
    const file = path.join(__dirname, '..', LOCAL_PORTRAIT);
    expect(fs.existsSync(file), `${LOCAL_PORTRAIT} must be committed`).toBe(true);
    const kb = fs.statSync(file).size / 1024;
    expect(kb, `portrait is ${kb.toFixed(0)}KB; it renders in a 100px circle`).toBeLessThan(200);
  });
});

test.describe('AC-7 live end-to-end against the real API', () => {
  test('renders from the real contributions service', async ({ page }) => {
    // No mocks: proves the shipped source is actually reachable today.
    await page.goto('/index.html');
    await expect(page.locator(`${GRAPH} .ContributionCalendar-day`).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator(GRAPH)).toContainText(/contributions in the last year/i);
  });
});
