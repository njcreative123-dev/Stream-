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
await page.waitForTimeout(2500);

await page.evaluate(() => {
  const fake = document.createElement('button');
  fake.setAttribute('data-libplay', '243884');
  fake.setAttribute('data-libt', 'Jeevan Ya Bheema Con (2026) Hindi 1080p');
  fake.id = 'fakeLibPlay';
  fake.style.cssText = 'position:fixed;left:5px;top:5px;z-index:99999';
  fake.textContent = 'PLAY';
  document.body.appendChild(fake);
});
await page.evaluate(() => document.getElementById('fakeLibPlay').click());
await page.waitForTimeout(7000);

const modalState = await page.evaluate(() => {
  const v = document.querySelector('#vmVideo');
  const pb = document.getElementById('vmPlayBtn');
  return { hasVideo: !!v, playBtnVisible: pb ? pb.style.display : 'n/a', modalVisible: !document.querySelector('#videoModal').classList.contains('hide') };
});
console.log('MODAL:', JSON.stringify(modalState));

// Click modal play if visible
await page.evaluate(() => { const pb = document.getElementById('vmPlayBtn'); if (pb && pb.style.display !== 'none') pb.click(); });
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
  return { currentTime: v.currentTime.toFixed(1), paused: v.paused, part: (document.getElementById('vmPartInfo')||{}).textContent || '', src: (v.currentSrc||'').slice(0,130) };
});
console.log('STATE_2:', JSON.stringify(s2));
await page.screenshot({ path: 'BIGMOVIE_playing2.png' });
console.log('REQS:'); reqs.forEach(u=>console.log('  ',u));
await browser.close();
