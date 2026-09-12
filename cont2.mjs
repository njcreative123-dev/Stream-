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
const g = (sel) => page.$eval(sel, e => e.textContent.trim()).catch(() => '');
const n = (sel) => page.$$eval(sel, els => els.length).catch(() => -1);

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await J(4000);

await clickNav('tv');
out.tv = {
  chips: await n('#tvFilters .chip, #tvFilters button'),
  cards: await n('#tvGrid .tv-card'),
  total: await g('#tvTotal'),
  working: await g('#tvWorking'),
  health: await g('#tvHealthMsg'),
  hindiChips: await page.$$eval('#tvFilters .chip, #tvFilters button', els => els.filter(e => /hindi/i.test(e.textContent)).map(e=>e.textContent.trim())).catch(()=>[])
};

// Hindi playback
await page.evaluate(() => {
  const chips = [...document.querySelectorAll('#tvFilters .chip, #tvFilters button')];
  const h = chips.find(c => /hindi/i.test(c.textContent));
  if (h) h.click();
});
await J(2000);
const cardsBefore = await n('#tvGrid .tv-card');
await page.evaluate(() => { const c = [...document.querySelectorAll('#tvGrid .tv-card')]; if (c.length) c[0].click(); });
await J(10000);
out.playback = await page.evaluate(() => {
  const v = document.getElementById('tvVideo');
  if (!v) return { err: 'no #tvVideo' };
  return { ready: v.readyState, paused: v.paused, time: Math.round(v.currentTime * 10) / 10, playing: !v.paused && v.currentTime > 0.5, err: v.error ? v.error.message : null, src: (v.currentSrc || v.src || '').slice(0, 80), title: (document.getElementById('tvPlaying')||{}).textContent };
});
out.tv.cardsAfterHindi = cardsBefore;
await page.screenshot({ path: '/root/johnny.heliohost./cont2_tv_play.png' });

await clickNav('tg');
out.tg = {
  msgs: await n('#tgMessages .msg-item, #tgMessages [class*=msg]'),
  docs: await page.$$eval('#tgMessages [class*=msg]', els => els.filter(e => /⬇|download/i.test(e.textContent)).length).catch(()=>-1),
  movies: await n('#moviesGrid .movie-card, #moviesGrid [class*=card]'),
  stats: await g('#tgStats')
};
await page.screenshot({ path: '/root/johnny.heliohost./cont2_tg.png' });

await clickNav('books');
out.books = {
  cards: await n('#booksGrid .book-card, #booksGrid [class*=card]'),
  readBtns: await page.$$eval('#booksGrid button', els => els.filter(e => /read/i.test(e.textContent)).length).catch(()=>-1)
};
await page.evaluate(() => { const b = [...document.querySelectorAll('#booksGrid button')].find(e => /read/i.test(e.textContent)); if (b) b.click(); });
await J(4000);
out.reader = {
  modalVisible: await page.$eval('#bookModal', e => !e.classList.contains('hide') && e.offsetParent !== null).catch(() => false),
  paras: await n('#readerContent p'),
  download: await g('#readerDownload'),
  title: await g('#readerTitle')
};
await page.screenshot({ path: '/root/johnny.heliohost./cont2_reader.png' });

await clickNav('catalog');
out.catalog = { chars: (await g('#pg-catalog')).length, text: (await g('#pg-catalog')).slice(0,120) };

console.log(JSON.stringify({ out, errors: errors.slice(0, 8), errorCount: errors.length }, null, 1));
await browser.close();
