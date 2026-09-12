import { chromium } from 'playwright';
const CHROME = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.goto('https://njsoft-stream.njcreative123.workers.dev/', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(5000);
const info = await page.evaluate(() => {
  const g = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { w: el.getBoundingClientRect().width, mw: cs.minWidth, ml: cs.marginLeft, mr: cs.marginRight, disp: cs.display, pos: cs.position, flex: cs.flex, overflow: cs.overflow, width: cs.width, transform: cs.transform };
  };
  return {
    app: g('#app, .app'),
    side: g('.side'),
    main: g('#main, .main'),
    body: g('body'),
    html: g('html'),
    sideRect: (() => { const el = document.querySelector('.side'); if(!el) return null; const r = el.getBoundingClientRect(); return {w:r.width, right:r.right, left:r.left}; })(),
  };
});
console.log(JSON.stringify(info, null, 1));
// check media query match
const mq = await page.evaluate(() => ({ 'max820': matchMedia('(max-width:820px)').matches, 'max600': matchMedia('(max-width:600px)').matches }));
console.log('MQ:', JSON.stringify(mq));
await browser.close();
