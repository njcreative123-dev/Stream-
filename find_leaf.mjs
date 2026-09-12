import { chromium } from 'playwright';
const CHROME = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.goto('https://njsoft-stream.njcreative123.workers.dev/', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(5000);
const leaves = await page.evaluate(() => {
  const out = [];
  const check = (el, depth) => {
    if (depth > 40) return;
    const ow = el.offsetWidth;
    if (ow >= 500) out.push({ tag: el.tagName, id: el.id||'', cls: (el.className||'').toString().slice(0,50), ow, depth, txt: (el.innerText||el.textContent||'').slice(0,35).replace(/\s+/g,' ') });
    for (const c of el.children) check(c, depth+1);
  };
  check(document.body, 0);
  // also find elements whose scrollWidth > clientWidth significantly
  return out.sort((a,b)=>b.ow-a.ow).slice(0,25);
});
console.log(JSON.stringify(leaves, null, 1));
await browser.close();
