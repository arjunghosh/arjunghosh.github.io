// Standalone V8 coverage collector for the inline contribution-graph script
// in index.html. Drives every rendering scenario (success / degraded /
// image-fallback / total-failure) and prints a line-coverage report plus the
// list of uncovered source lines, so we can see exactly what is untested.
//
// Run: node tests/coverage-report.js
const { chromium } = require('@playwright/test');
const http = require('http');
const fs = require('fs');
const path = require('path');
const {
  mockPrimary,
  killPrimary,
  mockFallbackImage,
  killFallbackImage,
} = require('./fixtures');

const ROOT = path.resolve(__dirname, '..');

function staticServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.statusCode = 404;
      return res.end('not found');
    }
    res.end(fs.readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// One scenario: apply routes, load, wait for the graph to settle, return the
// covered byte offsets for the inline script + its source text.
async function collect(browser, base, setup) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  await page.coverage.startJSCoverage();
  await page.goto(base + '/index.html');
  // Give the fetch chain (success or timeout path) time to resolve + render.
  await page.waitForTimeout(1500);
  const entries = await page.coverage.stopJSCoverage();
  await context.close();
  // Inline script is the entry whose source contains our marker function.
  const inline = entries.find((e) => e.source && e.source.includes('function renderGrid'));
  if (!inline) return null;
  // V8 ranges are NESTED: an uncovered (count:0) child range is carved out of a
  // covered parent. Apply ranges largest-first so the innermost range wins for
  // each byte — otherwise carved-out uncovered code reads as covered.
  const ranges = [];
  for (const fn of inline.functions) for (const r of fn.ranges) ranges.push(r);
  ranges.sort((a, b) => (b.endOffset - b.startOffset) - (a.endOffset - a.startOffset));
  const covered = new Set();
  for (const r of ranges) {
    for (let o = r.startOffset; o < r.endOffset; o++) {
      if (r.count > 0) covered.add(o);
      else covered.delete(o);
    }
  }
  return { source: inline.source, covered };
}

function lineCoverage(source, coveredOffsets) {
  const lines = source.split('\n');
  const results = [];
  let offset = 0;
  for (const line of lines) {
    const start = offset;
    const end = offset + line.length; // newline excluded
    const code = line.trim();
    // Count only lines with executable-ish content (skip blanks, braces-only,
    // comments) — matches how coverage tools report meaningful lines.
    const isMeaningful =
      code.length > 0 &&
      !/^[{}();]*$/.test(code) &&
      !code.startsWith('//') &&
      !code.startsWith('*') &&
      !code.startsWith('/*');
    if (isMeaningful) {
      let hit = false;
      for (let o = start; o < end; o++) if (coveredOffsets.has(o)) { hit = true; break; }
      results.push({ code, hit });
    }
    offset = end + 1; // account for newline
  }
  return results;
}

(async () => {
  const server = await staticServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();

  const scenarios = [
    ['success (real payload)', async (p) => { await mockPrimary(p); }],
    ['degraded (primary down, fallback image ok)', async (p) => { await killPrimary(p); await mockFallbackImage(p); }],
    ['total failure (both down)', async (p) => { await killPrimary(p); await killFallbackImage(p); }],
  ];

  let source = null;
  const covered = new Set();
  for (const [, setup] of scenarios) {
    const r = await collect(browser, base, setup);
    if (r) {
      source = r.source;
      for (const o of r.covered) covered.add(o);
    }
  }
  await browser.close();
  server.close();

  if (!source) {
    console.error('Inline script not found in coverage output.');
    process.exit(2);
  }

  const results = lineCoverage(source, covered);
  const total = results.length;
  const hit = results.filter((r) => r.hit).length;
  const pct = ((hit / total) * 100).toFixed(1);

  console.log('\n==== Inline JS coverage — index.html contribution graph ====');
  console.log(`Meaningful lines: ${total}  |  Covered: ${hit}  |  Coverage: ${pct}%\n`);
  const uncovered = results.filter((r) => !r.hit);
  if (uncovered.length) {
    console.log('Uncovered lines:');
    for (const u of uncovered) console.log('  ✗  ' + u.code);
  } else {
    console.log('All meaningful lines covered.');
  }
  console.log('');
  // Exit non-zero if below the 90% gate, so CI / callers can enforce it.
  process.exit(Number(pct) >= 90 ? 0 : 1);
})();
