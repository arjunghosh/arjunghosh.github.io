// Deterministic stand-in for the GitHub contributions API, so the grid tests
// do not depend on a live third-party service (the exact failure mode that
// broke the site in the first place).

const PRIMARY_GLOB = '**/github-contributions-api.jogruber.de/**';
const FALLBACK_GLOB = '**/ghchart.rshah.org/**';

/** 371 days ending on a fixed date, with a repeating level pattern. */
function buildContributions() {
  const contributions = [];
  const end = Date.UTC(2026, 7, 3); // 2026-08-03, fixed so tests are stable
  const DAY = 86400000;
  let total = 0;
  for (let i = 370; i >= 0; i--) {
    const level = i % 5;
    const count = level * 3;
    total += count;
    contributions.push({
      date: new Date(end - i * DAY).toISOString().slice(0, 10),
      count,
      level,
    });
  }
  return { total: { lastYear: total }, contributions };
}

const CONTRIBUTIONS = buildContributions();

/** 1x1 transparent PNG, used to stand in for the ghchart SVG. */
const TINY_IMAGE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

/** Serve the fixture JSON instead of calling the real API. */
async function mockPrimary(page, body = CONTRIBUTIONS) {
  await page.route(PRIMARY_GLOB, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(body),
    })
  );
}

/** Simulate the primary source being unreachable (the bloggify 522 scenario). */
async function killPrimary(page) {
  await page.route(PRIMARY_GLOB, (route) => route.abort('failed'));
}

/** Serve a stub image for the fallback chart. */
async function mockFallbackImage(page) {
  await page.route(FALLBACK_GLOB, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: TINY_IMAGE })
  );
}

/** Simulate the fallback image host being down too. */
async function killFallbackImage(page) {
  await page.route(FALLBACK_GLOB, (route) => route.abort('failed'));
}

module.exports = {
  CONTRIBUTIONS,
  PRIMARY_GLOB,
  FALLBACK_GLOB,
  mockPrimary,
  killPrimary,
  mockFallbackImage,
  killFallbackImage,
};
