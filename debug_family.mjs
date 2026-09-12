import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev/family';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('console', msg => { if (msg.type() === 'error') errs.push('[console] ' + msg.text().slice(0, 300)); });
  page.on('pageerror', err => errs.push('[pageerror] ' + String(err).slice(0, 300)));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(4000);
  console.log('HASH:', await page.evaluate(() => location.hash));
  console.log('PATH:', await page.evaluate(() => location.pathname));
  console.log('ACTIVE PAGES:', await page.evaluate(() => Array.from(document.querySelectorAll('.page.active')).map(p => p.id)));
  console.log('state.page:', await page.evaluate(() => (typeof state !== 'undefined' ? state.page : 'undefined')));
  console.log('ERRORS:', errs.slice(0, 10));
  await page.screenshot({ path: 'DEBUG_family.png' });
  await browser.close();
})();
