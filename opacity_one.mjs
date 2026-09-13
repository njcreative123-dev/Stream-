import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(4000);
await page.evaluate(()=>{document.querySelector('[data-nav="movies"]').click();});
await page.waitForTimeout(4000);
const st = await page.evaluate(() => {
  const a = document.getElementById('pg-movies');
  const cs = getComputedStyle(a);
  const r = a.getBoundingClientRect();
  return { opacity: cs.opacity, anim: cs.animationName, disp: cs.display, vis: cs.visibility,
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    childOpacity: a.firstElementChild ? getComputedStyle(a.firstElementChild).opacity : null,
    textVisibility: document.getElementById('main').innerText.slice(0,50) };
});
console.log('DESKTOP pg-movies:', JSON.stringify(st, null, 1));
await browser.close();
