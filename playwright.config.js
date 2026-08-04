// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Parallel-agent isolation: never bind a default/shared port.
// Each run picks its own port unless one is pinned via env.
const PORT = Number(process.env.PORT) || 3001 + Math.floor(Math.random() * 1000);

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Skip the local server when testing a deployed URL (live UAT).
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `python3 -m http.server ${PORT} --bind 127.0.0.1`,
        url: `http://127.0.0.1:${PORT}/index.html`,
        reuseExistingServer: false,
        timeout: 20000,
      },
});
