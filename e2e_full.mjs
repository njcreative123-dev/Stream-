import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message.slice(0,120)));
await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(2500);

// Test each page navigation + content
const pages = [
  { nav: 'tv', check: () => page.locator('.tv-card').count() },
  { nav: 'movies', check: () => page.locator('#moviesGrid .movie-card, .movie-card').count() },
  { nav: 'books', check: () => page.locator('#booksGrid .card, .book-card, #pg-books .card').count() },
  { nav: 'tg', check: () => page.locator('.tg-msg, .tg-card, #pg-tg .msg-wrap, #pg-tg .card').count() },
  { nav: 'search', check: () => 1 },
  { nav: 'af', check: () => 1 },
];

for (const p of pages) {
  await page.evaluate(n => { const b = document.querySelector('[data-nav="'+n+'"]'); if(b) b.click(); }, p.nav);
  await page.waitForTimeout(4000);
  const count = await p.check();
  const rect = await page.evaluate(n => {
    const el = document.getElementById('pg-'+n) || document.getElementById('pg-home');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), active: el.classList.contains('active') };
  }, p.nav);
  console.log(`${p.nav}: items=${count} rect=${JSON.stringify(rect)}`);
  await page.screenshot({ path: `FINAL_V2_${p.nav}.png` });
}

// Mobile test
const mpage = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mpage.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await mpage.waitForTimeout(2500);
await mpage.screenshot({ path: 'FINAL_V2_mobile_home.png' });
await mpage.evaluate(() => { const t = document.getElementById('mtoggle'); if (t) t.click(); });
await mpage.waitForTimeout(500);
await mpage.screenshot({ path: 'FINAL_V2_mobile_nav.png' });
await mpage.evaluate(() => { const b = document.querySelector('[data-nav="movies"]'); if (b) b.click(); });
await mpage.waitForTimeout(3000);
await mpage.screenshot({ path: 'FINAL_V2_mobile_movies.png' });
const mMovies = await mpage.evaluate(() => {
  const el = document.getElementById('pg-movies');
  const r = el?.getBoundingClientRect();
  return { w: Math.round(r?.width || 0), h: Math.round(r?.height || 0), active: el?.classList.contains('active') };
});
console.log('Mobile movies:', JSON.stringify(mMovies));

console.log('ERRORS:', JSON.stringify(errs.slice(0,3)));
await browser.close();
