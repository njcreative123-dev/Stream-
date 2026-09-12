import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const out = {}; const errors = [];
const browser = await chromium.launch({ headless: true, executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
const J = ms => page.waitForTimeout(ms);
const clickNav = async nav => {
  try { await page.click(`.nav-btn[data-nav="${nav}"]`, { timeout: 8000 }); } catch { await page.evaluate(n => { const b = document.querySelector(`.nav-btn[data-nav="${n}"]`); if (b) b.click(); }, nav); }
  await J(3500);
};
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await J(4000);

await clickNav('movies');
const cards = await page.$$eval('#moviesGrid .movie-card', els => els.length).catch(() => -1);
const playBtns = await page.$$eval('#moviesGrid button', els => els.filter(e => /play/i.test(e.textContent)).length).catch(() => -1);
const titles = await page.$$eval('#moviesGrid .movie-card-title', els => els.slice(0,5).map(e=>e.textContent.trim())).catch(()=>[]);
out.movies = { cards, playBtns, titles };

// play first movie
await page.evaluate(() => { const b = [...document.querySelectorAll('#moviesGrid button')].find(e => /play/i.test(e.textContent)); if (b) b.click(); });
await J(9000);
out.moviePlay = await page.evaluate(() => {
  const v = document.querySelector('#playerModal video, #mvVideo, video');
  if (!v) return { err: 'no video' };
  return { ready: v.readyState, time: Math.round(v.currentTime * 10) / 10, err: v.error ? v.error.message : null, src: (v.currentSrc || '').slice(0, 70) };
});
await page.screenshot({ path: '/root/johnny.heliohost./cont3_movie_play.png' });
await page.keyboard.press('Escape').catch(()=>{}); await J(500);

await clickNav('home');
await page.screenshot({ path: '/root/johnny.heliohost./cont3_home.png' });
out.lastActive = await page.$eval('.page.active', e => e.id).catch(()=>'');

console.log(JSON.stringify({ out, errors: errors.slice(0, 6), errorCount: errors.length }, null, 1));
await browser.close();
