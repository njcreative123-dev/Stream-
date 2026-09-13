import { chromium } from 'playwright';
const url = 'https://njsoft-stream.njcreative123.workers.dev/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE_ERR: ' + m.text()); });
await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
await page.evaluate(() => { location.hash = '#tg'; });
await page.waitForTimeout(14000); // telegram data load

// Check ready buttons
const info = await page.evaluate(() => ({
  readyCount: document.querySelectorAll('.site-stream.ready').length,
  missingCount: document.querySelectorAll('.site-stream.missing').length,
  totalSiteStream: document.querySelectorAll('.site-stream').length,
}));
console.log('SITE STREAMS:', JSON.stringify(info));

if (info.readyCount > 0) {
  const firstBtn = page.locator('.site-stream.ready .nj-site-play').first();
  const title = await firstBtn.textContent();
  console.log('Clicking:', title);
  await firstBtn.click();
  await page.waitForTimeout(8000);
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
      error: v && v.error ? (v.error.code + ' ' + v.error.message) : null,
      title: document.getElementById('vmTitle')?.textContent
    };
  });
  console.log('MODAL STATE:', JSON.stringify(modal, null, 2));
  await page.screenshot({ path: 'proof_long_v2.png' });
}

console.log('ERRORS:', JSON.stringify(errs.slice(0, 15), null, 2));
await browser.close();
