import { chromium } from 'playwright';
const url = 'https://njsoft-stream.njcreative123.workers.dev/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE_ERR: ' + m.text()); });
await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
await page.evaluate(() => { location.hash = '#tg'; });
await page.waitForTimeout(14000);
const info = await page.evaluate(() => ({
  readyCount: document.querySelectorAll('.site-stream.ready').length,
  missingCount: document.querySelectorAll('.site-stream.missing').length,
  thumbCount: document.querySelectorAll('.mc-thumb.loaded').length,
}));
console.log('INFO:', JSON.stringify(info));

// Click first ready Play button (force: true to bypass potential overlay)
const btn = page.locator('.site-stream.ready .nj-site-play').first();
await btn.click({ force: true });
await page.waitForTimeout(10000);
const modal = await page.evaluate(() => {
  const m = document.getElementById('videoModal');
  const v = document.getElementById('vmVideo');
  return {
    modalVisible: m && !m.classList.contains('hide'),
    videoSrc: v ? v.src : '',
    paused: v ? v.paused : null,
    currentTime: v ? v.currentTime : null,
    readyState: v ? v.readyState : null,
    networkState: v ? v.networkState : null,
    duration: v ? v.duration : null,
    error: v && v.error ? (v.error.code + ' ' + v.error.message) : null,
    title: document.getElementById('vmTitle')?.textContent
  };
});
console.log('MODAL:', JSON.stringify(modal, null, 2));
await page.screenshot({ path: 'proof_long_v3.png' });
console.log('ERRORS:', JSON.stringify(errs.slice(0, 10), null, 2));
await browser.close();
