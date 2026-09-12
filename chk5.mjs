import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: EXE });
const out = {}; const errors = [];
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
const J = ms => page.waitForTimeout(ms);
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await J(4000);
const modes = ['tv','tg','movies','books','search','ai','nj'];
for (const nav of modes) {
  await page.evaluate(n => { const b = document.querySelector(`.nav-btn[data-nav="${n}"]`); if (b) b.click(); }, nav);
  await J(2200);
  const has = await page.$eval(`.page.active .agent3d .av-char`, e => !!e).catch(() => false);
  out[nav] = has;
  await page.screenshot({ path: `/root/johnny.heliohost./chk5_${nav}.png` });
}
// speak animation check
await page.evaluate(() => window.njAvatarSpeakAll(true));
await J(800);
out.talking = await page.$eval('.page.active .av-char', e => e.classList.contains('talking')).catch(() => false);
await page.evaluate(() => window.njAvatarSpeakAll(false));
await J(200);
out.talkingOff = await page.$eval('.page.active .av-char', e => e.classList.contains('talking')).catch(() => false);
console.log(JSON.stringify({ out, errors: errors.slice(0, 6), errorCount: errors.length }, null, 1));
await browser.close();
