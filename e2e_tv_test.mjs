import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
const logs = [];
page.on('pageerror', e => errors.push('ERR: ' + e.message.slice(0,200)));
page.on('console', m => { if (m.type() === 'error') logs.push('CON: ' + m.text().slice(0,200)); });

// 1) Load home
await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(2000);

// 2) Navigate to TV page
await page.evaluate(() => { const b = document.querySelector('[data-nav="tv"]'); if (b) b.click(); });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'E2E_tv_loaded.png', fullPage: false });
console.log('TV PAGE loaded, grid items:', await page.locator('#tvGrid .ch-card').count());

// 3) Click first channel card
const firstCard = page.locator('#tvGrid .ch-card').first();
if (await firstCard.count() > 0) {
  await firstCard.click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'E2E_tv_playing.png', fullPage: false });
  // Check if video element exists and has src
  const vidInfo = await page.evaluate(() => {
    const v = document.querySelector('#tvPlayer video, .tv-player video, video');
    if (!v) return { found: false };
    return { found: true, src: (v.src || v.currentSrc || '').slice(0, 120), paused: v.paused, readyState: v.readyState, error: v.error?.message || '' };
  });
  console.log('VIDEO:', JSON.stringify(vidInfo));
} else {
  console.log('NO channel cards found!');
}

// 4) Navigate to Movies page
await page.evaluate(() => { const b = document.querySelector('[data-nav="movies"]'); if (b) b.click(); });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'E2E_movies_loaded.png', fullPage: false });
console.log('MOVIES items:', await page.locator('#moviesGrid .movie-card, .movie-card, #pg-movies .card').count());

// 5) Navigate to Books
await page.evaluate(() => { const b = document.querySelector('[data-nav="books"]'); if (b) b.click(); });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'E2E_books_loaded.png', fullPage: false });
console.log('BOOKS items:', await page.locator('#booksGrid .card, .book-card').count());

// 6) Navigate to Telegram
await page.evaluate(() => { const b = document.querySelector('[data-nav="tg"]'); if (b) b.click(); });
await page.waitForTimeout(4000);
await page.screenshot({ path: 'E2E_tg_loaded.png', fullPage: false });
const tgCount = await page.evaluate(() => { const g = document.getElementById('tgGrid'); return g ? g.children.length : -1; });
console.log('TG items:', tgCount);

// 7) Navigate to Family chat
await page.evaluate(() => { const b = document.querySelector('[data-nav="af"]'); if (b) b.click(); });
await page.waitForTimeout(1000);
// then click family tab
await page.evaluate(() => { const b = document.querySelector('[data-af="family"]'); if (b) b.click(); });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'E2E_family.png', fullPage: false });
const famVisible = await page.evaluate(() => {
  const pg = document.getElementById('pg-family');
  if (!pg) return 'no pg-family';
  const r = pg.getBoundingClientRect();
  return { w: r.width, h: r.height, active: pg.classList.contains('active') };
});
console.log('FAMILY:', JSON.stringify(famVisible));

console.log('ERRORS:', errors.length);
console.log('CONSOLE ERRORS:', logs.slice(0, 5).join(' | '));
await browser.close();
