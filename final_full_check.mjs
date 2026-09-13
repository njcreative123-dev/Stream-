import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';

// DESKTOP all pages
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(3500);

const pages = ['tv','movies','books','tg','search','af','catalog','nj'];
const results = [];
for (const p of pages) {
  await page.evaluate((pgName) => {
    const btns = document.querySelectorAll('[data-nav]');
    let btn = null;
    btns.forEach(b => { if (b.getAttribute('data-nav') === pgName) btn = b; });
    if (btn) btn.click(); else location.hash = '#'+ (pgName==='af'?'af':pgName);
  }, p).catch(()=>{});
  await page.waitForTimeout(1800);
  const r = await page.evaluate((pgName) => {
    const ids = pgName==='af' ? ['pg-ai','pg-family','pg-nj'] : ['pg-'+pgName];
    const out = {};
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      const b = el.getBoundingClientRect();
      out[id] = { w: Math.round(b.width), h: Math.round(b.height), parent: el.parentElement.id };
    }
    return out;
  }, p);
  results.push({ page: p, rects: r });
}
console.log('DESKTOP:', JSON.stringify(results));

// MOBILE fresh load skip nav
const mpage = await browser.newPage({ viewport: { width: 390, height: 844 } });
const merr = [];
mpage.on('pageerror', e => merr.push(e.message));
await mpage.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await mpage.waitForTimeout(3500);
const m = await mpage.evaluate(() => {
  const ids = ['pg-home','pg-tv','pg-movies','pg-books','pg-tg','pg-search'];
  const out = {};
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const b = el.getBoundingClientRect();
    out[id] = { w: Math.round(b.width), h: Math.round(b.height), active: el.classList.contains('active') };
  }
  return out;
});
// navigate on mobile via hamburger
await mpage.evaluate(() => { const t = document.getElementById('mtoggle'); if (t) t.click(); });
await mpage.waitForTimeout(600);
await mpage.evaluate(() => {
  const btn = document.querySelector('[data-nav="movies"]');
  if (btn) btn.click();
});
await mpage.waitForTimeout(2000);
const mm = await mpage.evaluate(() => {
  const el = document.getElementById('pg-movies');
  const b = el.getBoundingClientRect();
  return { movies: { w: Math.round(b.width), h: Math.round(b.height), active: el.classList.contains('active') } };
});
await mpage.screenshot({ path: 'FIX_MOBILE_movies.png' });
console.log('MOBILE home:', JSON.stringify(m));
console.log('MOBILE movies:', JSON.stringify(mm));
console.log('MOBILE pageerrors:', JSON.stringify(merr.slice(0,5)));
console.log('DESKTOP errors:', JSON.stringify(errors.slice(0,10)));
await browser.close();
