import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(4000);
// DESKTOP: click movies
await page.evaluate(()=>{document.querySelector('[data-nav="movies"]').click();});
await page.waitForTimeout(3000);
const chain = await page.evaluate(() => {
  // walk up from pg-movies
  let el = document.getElementById('pg-movies');
  const out = [];
  while (el) {
    const cs = getComputedStyle(el);
    out.push({ tag: el.tagName, id: el.id || '', cls: (el.className||'').toString().slice(0,40), opacity: cs.opacity, disp: cs.display, anim: cs.animationName, animDur: cs.animationDuration });
    el = el.parentElement;
    if (out.length > 6) break;
  }
  return out;
});
console.log('DESKTOP CHAIN:', JSON.stringify(chain, null, 1));
await page.screenshot({ path:'DESKTOP_movies_after_fix.png' });
await browser.close();
