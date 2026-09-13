import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = process.env.PWCHROME;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message.slice(0,150)));
await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(2500);

// AF page check
await page.evaluate(() => document.querySelector('[data-nav="af"]').click());
await page.waitForTimeout(3000);
const af = await page.evaluate(() => {
  return ['ai','family','nj'].map(p => {
    const el = document.getElementById('pg-'+p);
    return { p, display: el ? getComputedStyle(el).display : 'MISS', hash: location.hash };
  });
});
console.log('AF PAGES:', JSON.stringify(af));
await page.screenshot({ path: 'V9_af.png' });

// Long video re-test via fake card click (1.8GB movie 243884)
await page.evaluate(() => {
  const fake = document.createElement('button');
  fake.setAttribute('data-libplay', '243884');
  fake.setAttribute('data-libt', 'Jeevan Ya Bheema Con (2026) Hindi 1080p');
  fake.id = 'fakeLibPlay';
  fake.style.cssText = 'position:fixed;left:5px;top:5px;z-index:99999';
  document.body.appendChild(fake);
});
await page.evaluate(() => document.getElementById('fakeLibPlay').click());
await page.waitForTimeout(7000);
await page.evaluate(() => { const pb = document.getElementById('vmPlayBtn'); if (pb) pb.click(); });
await page.waitForTimeout(15000);
const st = await page.evaluate(() => {
  const v = document.querySelector('#vmVideo');
  return {
    src: (v.currentSrc||'').slice(0,110),
    paused: v.paused, readyState: v.readyState,
    currentTime: v.currentTime.toFixed(1),
    duration: v.duration ? v.duration.toFixed(1) : 'inf',
    part: (document.getElementById('vmPartInfo')||{}).textContent || '',
    title: (document.getElementById('vmTitle')||{}).textContent || '',
  };
});
console.log('BIG MOVIE:', JSON.stringify(st));
await page.screenshot({ path: 'V9_bigmovie.png' });
console.log('ERRS:', errs.length, errs.slice(0,3));
await browser.close();
