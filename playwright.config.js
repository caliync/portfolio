// End-to-end checks for the generated site (npm run generate), run in Chromium against a static
// server that serves it under /portfolio/, like GitHub Pages does.
// Run: npm test   (needs `npx playwright install chromium` once)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/portfolio/',
    trace: 'off',
    // Use a preinstalled Chromium when one is given (PW_CHROMIUM), else Playwright's own.
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: {
    command: 'node scripts/serve.mjs 4173',
    url: 'http://127.0.0.1:4173/portfolio/index.html',
    reuseExistingServer: !process.env.CI,
  },
});
