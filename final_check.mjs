import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(5000);
// HOME first
let homeRect = await page.evaluate(() => {
  const h = document.getElementById('pg-home');
  const r = h.getBoundingClientRect();
  return { op: getComputedStyle(h).opacity, w: Math.round(r.width), h: Math.round(r.height) };
});
console.log('HOME:', JSON.stringify(homeRect));
await page.screenshot({ path: 'FIX_home.png' });
// Movies after 10s wait
await page.evaluate(()=>document.querySelector('[data-nav="movies"]').click());
await page.waitForTimeout(10000);
let mv = await page.evaluate(() => {
  const a = document.getElementById('pg-movies');
  const r = a.getBoundingClientRect();
  const cs = getComputedStyle(a);
  return { op: cs.opacity, anim: cs.animationName, disp: cs.display, w: Math.round(r.width), h: Math.round(r.height), kids: a.children.length };
});
console.log('MOVIES 10s:', JSON.stringify(mv));
await page.screenshot({ path: 'FIX_movies.png' });
// TV after 5s
await page.evaluate(()=>document.querySelector('[data-nav="tv"]').click());
await page.waitForTimeout(5000);
let tv = await page.evaluate(() => {
  const a = document.getElementById('pg-tv');
  const r = a.getBoundingClientRect();
  const cs = getComputedStyle(a);
  return { op: cs.opacity, anim: cs.animationName, disp: cs.display, w: Math.round(r.width), h: Math.round(r.height), kids: a.children.length };
});
console.log('TV 5s:', JSON.stringify(tv));
await page.screenshot({ path: 'FIX_tv.png' });
await browser.close();
