import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(4000);
const rooms = [['tv','telly'],['tg','sathi'],['movies','filmy'],['books','kitabi'],['search','khojo'],['ai','nj'],['nj','nj2']];
for (const [nav, tag] of rooms) {
  await page.evaluate(n => { const b = document.querySelector(`.nav-btn[data-nav="${n}"]`); if (b) b.click(); }, nav);
  await page.waitForTimeout(2200);
  const box = await page.evaluate(() => {
    const s = document.querySelector('.page.active .agent3d');
    if (!s) return null;
    const b = s.getBoundingClientRect();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  });
  if (box) {
    await page.screenshot({ path: `/root/johnny.heliohost./crop_${tag}.png`, clip: { x: box.x - 24, y: box.y - 26, width: box.w + 48, height: box.h + 52 } });
  }
}
await browser.close();
console.log('done');
