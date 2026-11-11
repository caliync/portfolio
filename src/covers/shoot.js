// Screenshots the cover pages that make_covers.py wrote and saves them as WebP in images/covers/.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const out = path.resolve(__dirname, 'out');
const covers = path.resolve(__dirname, '..', '..', 'images', 'covers');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 991, height: 1300 } });
  for (const file of fs.readdirSync(out).filter((f) => f.endsWith('.html'))) {
    const name = path.basename(file, '.html');
    const png = path.join(out, name + '.png');
    await page.goto('file://' + path.join(out, file), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: png });
    execFileSync('python3', ['-c',
      'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], quality=86)',
      png, path.join(covers, name + '.webp')]);
    console.log('wrote images/covers/' + name + '.webp');
  }
  await browser.close();
})();
