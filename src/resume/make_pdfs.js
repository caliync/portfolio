// Prints resume.html and cv.html to the two PDFs at the repo root.
const { chromium } = require('playwright');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const jobs = [['resume.html', 'casey-ats-resume.pdf'], ['cv.html', 'casey-cv.pdf']];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [src, pdf] of jobs) {
    await page.goto('file://' + path.join(__dirname, src), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: path.join(root, pdf), format: 'Letter', printBackground: true, preferCSSPageSize: true });
    console.log('wrote ' + pdf);
  }
  await browser.close();
})();
