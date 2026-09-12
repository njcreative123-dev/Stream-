import { chromium } from 'playwright';
const CHROME = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const URL = 'https://njsoft-stream.njcreative123.workers.dev/';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox','--autoplay-policy=no-user-gesture-required','--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0,200)));
page.on('console', m => { if (m.type()==='error' && !m.text().includes('Failed to load resource')) errors.push(m.text().slice(0,200)); });
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);
// go to Telegram hub
await page.click('.nav-btn[data-nav="tg"]', { timeout: 8000 });
await page.waitForTimeout(8000);
const result = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.site-stream')];
  const stats = cards.map(c => ({ id: c.dataset.id, cls: c.className, status: (c.querySelector('.ss-status')||{}).textContent }));
  const vids = [...document.querySelectorAll('video.tg-msg-video')];
  return {
    siteStreamRows: cards.length,
    sample: stats.slice(0, 6),
    videoElements: vids.length,
    movieCards: document.querySelectorAll('.movie-card').length,
    tgMessages: document.querySelectorAll('.tg-msg').length,
  };
});
console.log('UI STATE:', JSON.stringify(result, null, 1));
console.log('console errors:', errors.length ? errors : 'NONE');
await page.screenshot({ path: 'proof_tg_desktop.png', fullPage: false });
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'proof_tg_mobile.png', fullPage: false });
await browser.close();
