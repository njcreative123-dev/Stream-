import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: EXE });
const out = {}; const errors = [];
// Mobile phone viewport
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
const J = ms => page.waitForTimeout(ms);
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await J(3500);
for (const nav of ['tv','tg','movies','books','search','ai','nj']) {
  await page.evaluate(n => { const b = document.querySelector(`.nav-btn[data-nav="${n}"]`); if (b) b.click(); }, nav);
  await J(1800);
  const has = await page.$eval(`.page.active .agent3d .av-char`, e => {
    const r = e.getBoundingClientRect();
    return { exists: true, w: Math.round(r.width), h: Math.round(r.height), visible: r.width>0 && r.height>0 };
  }).catch(() => false);
  out[nav] = has;
}
await page.evaluate(() => document.querySelector('.nav-btn[data-nav="tv"]').click());
await J(1800);
await page.screenshot({ path: '/root/johnny.heliohost./cont15_mobile_tv.png' });
console.log(JSON.stringify({ out, errors: errors.slice(0,5), errorCount: errors.length }, null, 1));
await browser.close();
