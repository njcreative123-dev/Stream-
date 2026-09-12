import { chromium } from 'playwright';
const CHROME = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.goto('https://njsoft-stream.njcreative123.workers.dev/', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(5000);
const wide = await page.evaluate(() => {
  const out = [];
  const main = document.querySelector('#main');
  main.querySelectorAll('*').forEach(el => {
    const ow = el.offsetWidth;
    if (ow > 400) {
      const cs = getComputedStyle(el);
      out.push({ tag: el.tagName, id: el.id, cls: (el.className||'').toString().slice(0,70), ow, mw: cs.minWidth, width: cs.width, display: cs.display, grid: cs.gridTemplateColumns });
    }
  });
  return out.sort((a,b)=>b.ow-a.ow).slice(0,30);
});
console.log(JSON.stringify(wide, null, 1));
await browser.close();
