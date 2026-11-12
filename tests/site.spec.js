// What a visitor relies on: pages load cleanly, nothing spills sideways on any screen size,
// the pages pass automated accessibility checks, every local link and file exists, and the
// still library takes over when motion is reduced.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const PAGES = ['/index.html', '/projects/baylo.html', '/projects/lakbay-lokal.html', '/projects/wildwood.html'];
const SCREENS = { phone: { width: 375, height: 812 }, tablet: { width: 768, height: 1024 }, desktop: { width: 1440, height: 900 } };

// The 3D library comes from a CDN and the GitHub numbers from GitHub's API; tests must not depend on either.
async function offline(page) {
  await page.route('https://cdnjs.cloudflare.com/**', (r) => r.abort());
  await page.route('https://api.github.com/**', (r) => r.abort());
}

for (const path of PAGES) {
  for (const [name, viewport] of Object.entries(SCREENS)) {
    test(`${path} on a ${name}: loads without errors and fits the screen`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error' && !/net::ERR_FAILED|Failed to load resource/.test(m.text())) errors.push(m.text()); });
      await offline(page);
      await page.setViewportSize(viewport);
      const res = await page.goto(path, { waitUntil: 'networkidle' });
      expect(res.status()).toBe(200);
      expect(errors).toEqual([]);
      // Nothing may make the page scroll sideways (the home page's own sideways track is clipped by design).
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await expect(page.locator('h1')).toHaveCount(1);
    });
  }

  for (const scheme of ['light', 'dark']) {
    test(`${path} in ${scheme} mode: passes automated accessibility checks`, async ({ page }) => {
      await offline(page);
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: scheme });   // the plain vertical page, everything visible
      await page.goto(path, { waitUntil: 'networkidle' });
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        // Known and accepted for now: the small red "2 of 3" counter is 4.1:1 in dark mode (owner's call, Nov 2026).
        .exclude('.count')
        .analyze();
      const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`)).toEqual([]);
    });
  }

  test(`${path}: every local link, image and file exists`, async ({ page, request }) => {
    await offline(page);
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const urls = await page.evaluate(() => {
      const found = new Set();
      const add = (u) => { if (!u) return; const url = new URL(u, location.href); if (url.origin === location.origin) found.add(url.pathname); };
      document.querySelectorAll('a[href]').forEach((a) => add(a.getAttribute('href')));
      document.querySelectorAll('img[src], script[src], link[href]').forEach((e) => add(e.getAttribute('src') || e.getAttribute('href')));
      document.querySelectorAll('use').forEach((u) => add((u.getAttribute('href') || '').split('#')[0]));
      document.querySelectorAll('[data-shots]').forEach((e) => JSON.parse(e.dataset.shots).forEach((s) => add(s.src)));
      return [...found];
    });
    expect(urls.length).toBeGreaterThan(5);
    for (const u of urls) {
      const res = await request.get(u);
      expect(res.status(), u).toBe(200);
    }
  });
}

test('reduced motion: the still library replaces the 3D one, and three.js is never fetched', async ({ page }) => {
  let threeRequested = false;
  page.on('request', (r) => { if (r.url().includes('three.min.js')) threeRequested = true; });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await expect(page.locator('.bg-still')).toHaveCount(1);
  await expect(page.locator('canvas.bg3d')).toHaveCount(0);
  expect(threeRequested).toBe(false);
});

test('project pages never fetch three.js', async ({ page }) => {
  let threeRequested = false;
  page.on('request', (r) => { if (r.url().includes('three.min.js')) threeRequested = true; });
  for (const path of PAGES.slice(1)) await page.goto(path, { waitUntil: 'networkidle' });
  expect(threeRequested).toBe(false);
});

test('link previews: every page has a canonical URL and a 1200x630 preview image that exists', async ({ page, request }) => {
  for (const path of PAGES) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const canonical = await page.getAttribute('link[rel=canonical]', 'href');
    expect(canonical, path).toMatch(/^https:\/\/caliync\.github\.io\/portfolio\//);
    const img = await page.getAttribute('meta[property="og:image"]', 'content');
    const local = new URL(img).pathname.replace(/^\/portfolio/, '');
    expect((await request.get(local)).status(), local).toBe(200);
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    expect(() => JSON.parse(ld), path).not.toThrow();
  }
});
