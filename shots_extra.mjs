import { chromium } from 'playwright';
const CHROME = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const URL = 'https://njsoft-stream.njcreative123.workers.dev/';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

async function shoot(name, w, h, mobile, dpr, pageAction) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(6000);
  if (pageAction) await pageAction(page);
  await page.screenshot({ path: 'final_' + name + '.png', fullPage: false });
  console.log('done', name);
  await ctx.close();
}

await shoot('tg_desktop_1440', 1440, 900, false, 1, async p => {
  await p.click('.nav-btn[data-nav="tg"]', { timeout: 4000 }).catch(()=>{});
  await p.waitForTimeout(7000);
});
await shoot('tv_mobile_390', 390, 844, true, 3, async p => {
  await p.click('#mtoggle', { timeout: 4000 }).catch(()=>{});
  await p.waitForTimeout(500);
  await p.click('.nav-btn[data-nav="tv"]', { timeout: 4000 }).catch(()=>{});
  await p.waitForTimeout(5000);
});
await shoot('home_ipad_820', 820, 1180, true, 2, async p => {});
await browser.close();
console.log('ALL DONE');
