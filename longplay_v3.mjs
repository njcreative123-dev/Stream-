import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = process.env.PWCHROME;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERR:', e.message.slice(0,200)));
page.on('console', m => { if (m.type()==='error') console.log('CONERR:', m.text().slice(0,250)); });
const mediaReqs = [];
page.on('request', req => { const u = req.url(); if (/github|api\/media|telesco/.test(u)) mediaReqs.push(u.slice(0,180)); });

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(3000);
await page.evaluate(() => document.querySelector('[data-nav="movies"]').click());
await page.waitForTimeout(4000);
await page.evaluate(() => document.querySelector('[data-mtype="tg"]').click());
await page.waitForTimeout(8000);

// Play first mirrored movie via card button
await page.evaluate(() => { const btn = document.querySelector('.lib-card [data-libplay]'); if (btn) btn.click(); });
await page.waitForTimeout(6000);

// Click the big modal Play button
const clicked = await page.evaluate(() => {
  const pb = document.getElementById('vmPlayBtn');
  if (pb && pb.style.display !== 'none') { pb.click(); return true; }
  const alt = document.querySelector('#vmPlayer .vpm-play, #videoModal .vpm-play');
  if (alt) { alt.click(); return true; }
  return false;
});
console.log('MODAL_PLAY_CLICKED:', clicked);
await page.waitForTimeout(20000);

const state = await page.evaluate(() => {
  const v = document.querySelector('#vmVideo');
  if (!v) return { found: false };
  return {
    found: true,
    src: (v.currentSrc || v.src || '').slice(0, 200),
    paused: v.paused,
    readyState: v.readyState,
    currentTime: v.currentTime.toFixed(1),
    duration: v.duration ? v.duration.toFixed(1) : 'inf',
    buffered: v.buffered && v.buffered.length ? v.buffered.end(v.buffered.length-1).toFixed(1) : '0',
    partInfo: (document.getElementById('vmPartInfo')||{}).textContent || '',
    title: (document.getElementById('vmTitle')||{}).textContent || '',
    err: v.error ? v.error.message : 'none',
  };
});
console.log('PLAYER:', JSON.stringify(state));
await page.screenshot({ path: 'LONGPROOF_v3.png' });
console.log('MEDIA_REQS:', mediaReqs.length);
mediaReqs.slice(0, 15).forEach(u => console.log('  ', u));
await browser.close();
