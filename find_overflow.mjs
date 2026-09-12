import { chromium } from 'playwright';
const CHROME = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.goto('https://njsoft-stream.njcreative123.workers.dev/', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(6000);
const wide = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width > 390 && r.width < 2000) {
      out.push({ tag: el.tagName, id: el.id, cls: (el.className||'').toString().slice(0,60), w: Math.round(r.width), left: Math.round(r.left), text: (el.innerText||'').slice(0,40).replace(/\n/g,' ') });
    }
  });
  return out.sort((a,b)=>b.w-a.w).slice(0,25);
});
console.log(JSON.stringify(wide, null, 1));
await browser.close();
