import { chromium } from 'playwright';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(5000);
const info = await page.evaluate(() => {
  const q = s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { x: r.x, y: r.y, w: r.width, h: r.height, display: cs.display, overflow: cs.overflow, margin: cs.margin, pos: cs.position }; };
  return {
    main: q('#main'), nav: q('nav'), hero: q('.stream-hero'), home: q('#pg-home'),
    media: [...document.querySelectorAll('style,link[rel=stylesheet]')].length,
    innerW: window.innerWidth,
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
