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
  await J(4000);
};
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await J(4000);

await clickNav('movies');
out.movies = {
  cards: await page.$$eval('#moviesGrid .media-card', els => els.length).catch(() => -1),
  firstTitles: await page.$$eval('#moviesGrid .media-card h4', els => els.slice(0,6).map(e=>e.textContent.trim())).catch(()=>[])
};
await page.screenshot({ path: '/root/johnny.heliohost./cont4_movies.png' });

// TG movie play: go to TG, find a message with play button
await clickNav('tg');
const playInfo = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('#tgMessages button')].filter(b => /play/i.test(b.textContent));
  if (!btns.length) return { found: false, totalBtns: [...document.querySelectorAll('#tgMessages button')].length };
  btns[0].click();
  return { found: true };
});
await J(9000);
out.tgPlay = await page.evaluate(() => {
  const v = document.querySelector('#playModal video, #mvPlayer video, #tgModal video, video[controls]');
  if (!v) return { err: 'no player video', html: (document.querySelector('body')||{}).innerHTML ? 'body-len:' + document.body.innerHTML.length : 0 };
  return { ready: v.readyState, time: Math.round(v.currentTime * 10) / 10, err: v.error ? v.error.message : null, src: (v.currentSrc || '').slice(0, 80) };
});
out.tgPlay.btn = playInfo;
await page.screenshot({ path: '/root/johnny.heliohost./cont4_tg_play.png' });

console.log(JSON.stringify({ out, errors: errors.slice(0, 6), errorCount: errors.length }, null, 1));
await browser.close();
