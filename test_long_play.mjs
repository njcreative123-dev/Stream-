import { chromium } from 'playwright';
const url = 'https://njsoft-stream.njcreative123.workers.dev/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
await page.evaluate(() => { location.hash = '#tg'; });
await page.waitForTimeout(16000); // telegram loads 151 msgs slowly
const btnCount = await page.evaluate(() => document.querySelectorAll('.nj-site-play').length);
console.log('Play on NJStream buttons:', btnCount);
const readyCount = await page.evaluate(() => document.querySelectorAll('.site-stream.ready').length);
const missingCount = await page.evaluate(() => document.querySelectorAll('.site-stream.missing').length);
console.log('ready:', readyCount, 'missing:', missingCount);
if (readyCount > 0) {
  const firstBtn = page.locator('.site-stream.ready .nj-site-play').first();
  await firstBtn.click();
  await page.waitForTimeout(5000);
  const modal = await page.evaluate(() => {
    const m = document.getElementById('videoModal');
    const v = document.getElementById('vmVideo');
    return {
      modalVisible: m && !m.classList.contains('hide'),
      videoSrc: v ? v.src : '',
      paused: v ? v.paused : null,
      currentTime: v ? v.currentTime : null,
      readyState: v ? v.readyState : null,
      error: v && v.error ? (v.error.code + ' ' + v.error.message) : null,
      title: document.getElementById('vmTitle')?.textContent
    };
  });
  console.log('MODAL:', JSON.stringify(modal, null, 2));
  await page.screenshot({ path: 'proof_long_live.png' });
}
console.log('ERRORS:', JSON.stringify(errs.slice(0, 10), null, 2));
await browser.close();
