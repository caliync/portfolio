// Screenshots the preview pages that make_og.py wrote and saves them as JPEG in images/og/.
// JPEG, not WebP: some link-preview crawlers still skip WebP images.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const out = path.resolve(__dirname, 'out');
const dest = path.resolve(__dirname, '..', '..', 'images', 'og');

(async () => {
  fs.mkdirSync(dest, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const file of fs.readdirSync(out).filter((f) => f.endsWith('.html'))) {
    const name = path.basename(file, '.html');
    await page.goto('file://' + path.join(out, file), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(dest, name + '.jpg'), type: 'jpeg', quality: 86 });
    console.log('wrote images/og/' + name + '.jpg');
  }
  await browser.close();
})();
