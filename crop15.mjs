import { chromium } from 'playwright';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(3000);
for (const [nav, name] of [['tv','telly'],['tg','sathi'],['movies','filmy'],['books','kitabi'],['search','khojo'],['ai','nj'],['nj','nj2']]) {
  await page.evaluate(n => { const b = document.querySelector(`.nav-btn[data-nav="${n}"]`); if (b) b.click(); }, nav);
  await page.waitForTimeout(1500);
  const box = await page.$eval(`.page.active .agent3d .av-char`, e => {
    const r = e.getBoundingClientRect();
    return { x: Math.max(0, r.x - 30), y: Math.max(0, r.y - 30), w: r.width + 60, h: r.height + 60, dpr: window.devicePixelRatio };
  }).catch(()=>null);
  if (box) {
    const clip = { x: box.x * box.dpr, y: box.y * box.dpr, width: box.w * box.dpr, height: box.h * box.dpr };
    await page.screenshot({ path: `/root/johnny.heliohost./crop15_${name}.png`, clip: { x: box.x, y: box.y, width: box.w, height: box.h } });
  }
}
console.log('crops done');
await browser.close();
