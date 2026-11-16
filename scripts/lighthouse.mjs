// Runs Lighthouse on the generated site and fails if a score drops below its floor.
//   npm run generate && npm run lighthouse
//
// It serves .output/public under /portfolio/ (scripts/serve.mjs), opens each page in headless
// Chromium on a throttled "mobile" profile, and prints a table. The floors sit a little under what
// the site scores now, so a real regression fails the build but run-to-run noise doesn't.
//
// The home page is measured with reduced motion on, which shows the still library instead of the
// 3D scene: a CI machine has no graphics card, and drawing WebGL in software would measure the
// machine, not the site. The 3D scene's cost on a real phone is not covered by this check.
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'

const PORT = 4190
const BASE = `http://127.0.0.1:${PORT}/portfolio/`
const FLOORS = { performance: 85, accessibility: 95, 'best-practices': 95, seo: 95 }
const PAGES = [
  { path: '', name: 'Home' },
  { path: 'projects/baylo.html', name: 'Baylo' },
]

const server = spawn('node', ['scripts/serve.mjs', String(PORT)], { stdio: 'ignore' })
const chromePath = process.env.CHROME_PATH || chromium.executablePath()
const rows = []
let failed = false

try {
  await new Promise((r) => setTimeout(r, 1000))
  for (const page of PAGES) {
    const chrome = await launch({
      chromePath,
      chromeFlags: ['--headless=new', '--no-sandbox', '--force-prefers-reduced-motion'],
    })
    try {
      const run = await lighthouse(BASE + page.path, {
        port: chrome.port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: Object.keys(FLOORS),
      })
      const lhr = run.lhr
      const scores = Object.fromEntries(Object.entries(lhr.categories).map(([k, v]) => [k, Math.round((v.score ?? 0) * 100)]))
      const low = Object.entries(FLOORS).filter(([k, floor]) => scores[k] < floor)
      if (low.length) failed = true
      rows.push({
        page: page.name,
        ...scores,
        'FCP': lhr.audits['first-contentful-paint'].displayValue,
        'LCP': lhr.audits['largest-contentful-paint'].displayValue,
        'CLS': lhr.audits['cumulative-layout-shift'].displayValue,
        result: low.length ? 'BELOW: ' + low.map(([k, f]) => `${k} < ${f}`).join(', ') : 'ok',
      })
    } finally {
      await chrome.kill()
    }
  }
} finally {
  server.kill()
}

console.table(rows)
if (failed) {
  console.error(`A score is below its floor (${JSON.stringify(FLOORS)}).`)
  process.exit(1)
}
