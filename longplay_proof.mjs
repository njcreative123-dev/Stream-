import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = process.env.PWCHROME;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERR:', e.message.slice(0,200)));
page.on('console', m => { if (m.type()==='error') console.log('CONERR:', m.text().slice(0,200)); });
const mediaReqs = [];
page.on('request', req => { const u = req.url(); if (/github|telegram|api\/media|telesco/.test(u)) mediaReqs.push(u.slice(0,160)); });

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(3000);
await page.evaluate(() => { const b = document.querySelector('[data-nav="movies"]'); if (b) b.click(); });
await page.waitForTimeout(4000);
await page.evaluate(() => { const t = document.querySelector('[data-mtype="tg"]'); if (t) t.click(); });
await page.waitForTimeout(8000);

// Find a mirrored movie card
const cardInfo = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.lib-card')];
  return cards.slice(0, 8).map((c, i) => ({ i, title: (c.querySelector('.lib-title')||{}).textContent || '', hasPlay: !!c.querySelector('[data-libplay]') }));
});
console.log('CARDS:', JSON.stringify(cardInfo));
const playBtn = page.locator('.lib-card [data-libplay]').first();
const title = await page.locator('.lib-card .lib-title').first().textContent().catch(()=> '');
console.log('PLAYING:', title);
await playBtn.click();
await page.waitForTimeout(15000);

const state = await page.evaluate(() => {
  const v = document.querySelector('#vmVideo');
  if (!v) return { found: false };
  return {
    found: true,
    src: (v.currentSrc || v.src || '').slice(0, 160),
    paused: v.paused,
    readyState: v.readyState,
    currentTime: v.currentTime.toFixed(1),
    duration: v.duration ? v.duration.toFixed(1) : 'inf',
    buffered: v.buffered && v.buffered.length ? v.buffered.end(v.buffered.length-1).toFixed(1) : '0',
    error: v.error ? v.error.message : 'none',
    partInfo: (document.getElementById('vmPartInfo')||{}).textContent || '',
    title: (document.getElementById('vmTitle')||{}).textContent || '',
  };
});
console.log('PLAYER:', JSON.stringify(state));
await page.screenshot({ path: 'LONGPROOF_playing.png', fullPage: false });
console.log('MEDIA_REQS:', mediaReqs.length);
mediaReqs.slice(0, 12).forEach(u => console.log('  ', u));
await browser.close();
