import { chromium } from 'playwright';
const CHROME = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const URL = 'https://njsoft-stream.njcreative123.workers.dev/';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type()==='error') errors.push(m.text().slice(0,100)); });
page.on('pageerror', e => errors.push(String(e).slice(0,100)));
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(5000);

// Try to click TELGEGRAM/Data nav item
const navResult = await page.evaluate(() => {
  const links = [...document.querySelectorAll('.side a, .nav-link, [data-page], button')];
  const tg = links.filter(a => /telegram|data|टेली/i.test((a.textContent||'') + ' ' + (a.dataset?.page||'')));
  return tg.slice(0,5).map(a => ({ tag: a.tagName, text: (a.textContent||'').trim().slice(0,30), page: a.dataset?.page||'', href: a.getAttribute('href')||'' }));
});
console.log('TG nav items:', JSON.stringify(navResult));
// click via JS state
await page.evaluate(() => {
  const fns = ['showPage', 'navTo', 'go'];
  for (const fn of fns) { if (typeof window[fn] === 'function') { console.log('found fn', fn); } }
  const tgLink = [...document.querySelectorAll('a[data-page], .side a')].find(a => /telegram|data/i.test((a.textContent||'') + (a.dataset?.page||'')));
  if (tgLink) { tgLink.click(); return 'clicked: ' + tgLink.textContent.trim().slice(0,30); }
  return 'no link';
});
await page.waitForTimeout(4000);
const stats = await page.evaluate(() => {
  const cards = document.querySelectorAll('.movie-card').length;
  const vids = document.querySelectorAll('video.tg-msg-video, .tg-msg video').length;
  const docs = document.querySelectorAll('.doc-big-notice, .doc-row, [class*="doc-"]').length;
  const tgMsgs = document.querySelectorAll('.tg-msg').length;
  return { cards, vids, docs, tgMsgs, pageActive: document.querySelector('.page.active')?.id || 'none' };
});
console.log('TG page stats:', JSON.stringify(stats));
console.log('errors:', errors.length ? errors : 'NONE');
await page.screenshot({ path: 'shot_tg_page.png' });
await browser.close();
