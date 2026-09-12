import { chromium } from 'playwright';
const CHROME = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const URL = 'https://njsoft-stream.njcreative123.workers.dev/';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });

async function shoot(name, w, h, mobile, dpr, pageAction) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0,80)));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(6000);
  if (pageAction) await pageAction(page);
  await page.screenshot({ path: 'final_' + name + '.png', fullPage: false });
  console.log(name, '| errors:', errs.length ? errs : 'NONE');
  await ctx.close();
}

// Home mobile
await shoot('home_mobile_390', 390, 844, true, 3, async p => {});
// Home desktop
await shoot('home_desktop_1440', 1440, 900, false, 1, async p => {});
// TG page mobile
await shoot('tg_mobile_390', 390, 844, true, 3, async p => {
  await p.click('#mtoggle', { timeout: 4000 }).catch(()=>{});
  await p.waitForTimeout(500);
  await p.click('.nav-btn[data-nav="tg"]', { timeout: 4000 }).catch(()=>{});
  await p.waitForTimeout(7000);
});
// TG page desktop
await shoot('tg_desktop_1440', 1440, 900, false, 1, async p => {
  await p.click('.nav-btn[data-nav="tg"]', { timeout: 4000 }).catch(()=>{});
  await p.waitForTimeout(7000);
});
// TV mobile
await shoot('tv_mobile_390', 390, 844, true, 3, async p => {
  await p.click('#mtoggle', { timeout: 4000 }).catch(()=>{});
  await p.waitForTimeout(500);
  await p.click('.nav-btn[data-nav="tv"]', { timeout: 4000 }).catch(()=>{});
  await p.waitForTimeout(5000);
});
// iPad
await shoot('home_ipad_820', 820, 1180, true, 2, async p => {});
await browser.close();
console.log('ALL SHOTS DONE');
