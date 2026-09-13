import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = process.env.PWCHROME;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERR:', e.message.slice(0,200)));
page.on('console', m => { if (m.type()==='error') console.log('CONERR:', m.text().slice(0,220)); });
const reqs = [];
page.on('request', req => { const u = req.url(); if (/api\/media/.test(u)) reqs.push(u.slice(0,150)); });

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(3000);

// Directly invoke libPlay for the 1.8GB multi-part movie
await page.evaluate(() => libPlay('243884', 'Jeevan Ya Bheema Con (2026) Hindi 1080p'));
await page.waitForTimeout(6000);
await page.evaluate(() => { const pb = document.getElementById('vmPlayBtn'); if (pb) pb.click(); });
await page.waitForTimeout(15000);

const s1 = await page.evaluate(() => {
  const v = document.querySelector('#vmVideo');
  return {
    src: (v.currentSrc||'').slice(0,130),
    paused: v.paused, readyState: v.readyState,
    currentTime: v.currentTime.toFixed(1),
    duration: v.duration ? v.duration.toFixed(1) : 'inf',
    part: (document.getElementById('vmPartInfo')||{}).textContent || '',
    title: (document.getElementById('vmTitle')||{}).textContent || '',
  };
});
console.log('STATE_1:', JSON.stringify(s1));
await page.waitForTimeout(12000);
const s2 = await page.evaluate(() => {
  const v = document.querySelector('#vmVideo');
  return { currentTime: v.currentTime.toFixed(1), paused: v.paused, part: (document.getElementById('vmPartInfo')||{}).textContent || '' };
});
console.log('STATE_2:', JSON.stringify(s2));
await page.screenshot({ path: 'BIGMOVIE_playing.png' });
console.log('REQS:', reqs.length); reqs.slice(0,12).forEach(u=>console.log('  ',u));
await browser.close();
