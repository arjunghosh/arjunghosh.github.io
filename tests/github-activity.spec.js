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
const GH_DARK_PALETTE = ['#151b23', '#033a16', '#196c2e', '#2ea043', '#56d364'];
const NEON_GREEN = GH_DARK_PALETTE[4];

test.describe('AC-8 GitHub neon-green palette', () => {
  test('each level is filled with its pinned palette colour', async ({ page }) => {
    await mockPrimary(page);
    await page.goto('/index.html');
    await expect(page.locator(`${GRAPH} .ContributionCalendar-day`).first()).toBeVisible();

    const pairs = await page
      .locator(`${GRAPH} .ContributionCalendar-day`)
      .evaluateAll((els) =>
        els.map((el) => [el.getAttribute('data-level'), el.getAttribute('fill')])
      );

    const seen = new Set();
    for (const [level, fill] of pairs) {
      expect(String(fill).toLowerCase()).toBe(GH_DARK_PALETTE[Number(level)]);
      seen.add(level);
    }
    // The fixture spans all five levels, so all five must have been exercised.
    expect(seen.size).toBe(5);
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
    expect(fills).toEqual(GH_DARK_PALETTE);
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
