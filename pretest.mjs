import { chromium } from 'playwright';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 375, height: 812 } })).newPage();
const logs = [];
page.on('console', m => { if (m.type() === 'error') logs.push(m.text()); });
page.on('pageerror', e => logs.push('PAGEERR: ' + e.message));

// First test the CURRENT deployed version as baseline
console.log('=== BASELINE (current deploy) ===');
await page.goto('https://njsoft-stream.njcreative123.workers.dev/', { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForTimeout(3500);
const base = await page.evaluate(() => ({
  loader: document.getElementById('loader')?.style.display,
  activePage: document.querySelector('.page.active')?.id,
  text: document.body.innerText.substring(0, 200),
}));
console.log('Loader hidden:', base.loader === 'none' || base.loader === '');
console.log('Active:', base.activePage);
console.log('Errors:', logs.length);
logs.forEach(l => console.log(' ', l.substring(0, 120)));
await page.screenshot({ path: '/tmp/njbaseline.png' });
await browser.close();
