import { chromium } from 'playwright';
const base = 'https://njsoft-stream.njcreative123.workers.dev';
const browser = await chromium.launch({ headless: true });
const cleanErrs = (errs) => errs.filter(e => !/favicon|401|403/i.test(e));

// DESKTOP
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));
  await page.goto(base + '/#home', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(4500);
  await page.screenshot({ path: 'FINAL_desktop_home.png' });
  await page.click('[data-nav="tv"]'); await page.waitForTimeout(3500);
  const chan = await page.evaluate(() => {
    const cards = document.querySelectorAll('.tv-card, .ch-card, .ch-row-card').length;
    const cats = document.querySelectorAll('.tv-cat, [data-tvcat]').length;
    return { cards: cards, cats: cats };
  });
  await page.screenshot({ path: 'FINAL_desktop_tv.png' });
  await page.click('[data-nav="tg"]'); await page.waitForTimeout(4000);
  const tgMsgs = await page.locator('#tgMessages .tg-msg').count();
  await page.screenshot({ path: 'FINAL_desktop_tg.png' });
  console.log('DESKTOP tv:', JSON.stringify(chan), '| tgMsgs:', tgMsgs);
  console.log('DESKTOP errors:', JSON.stringify(cleanErrs(errors)));
  await ctx.close();
}

// MOBILE
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));
  await page.goto(base + '/#ai', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(2500);
  await page.locator('.chat-input').scrollIntoViewIfNeeded();
  await page.fill('#chatIn', 'Hello NJ, test from Codex');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'FINAL_mobile_ai.png' });
  const aiMsgs = await page.locator('.chat-msg').count();
  await page.click('#mtoggle'); await page.waitForTimeout(300);
  await page.click('[data-nav="tg"]'); await page.waitForTimeout(4000);
  await page.screenshot({ path: 'FINAL_mobile_tg.png', fullPage: true });
  const btn = page.locator('button:has-text("Load More")');
  let pag = 'n/a';
  if (await btn.count() > 0) {
    const before = await page.locator('#tgMessages .tg-msg').count();
    await btn.first().click();
    await page.waitForTimeout(12000);
    const after = await page.locator('#tgMessages .tg-msg').count();
    pag = `${before} -> ${after}`;
  }
  console.log('MOBILE aiMsgs:', aiMsgs, '| tg pagination:', pag);
  console.log('MOBILE errors:', JSON.stringify(cleanErrs(errors)));
  await ctx.close();
}

// SMALL VIDEO PLAY on desktop tg page
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(base + '/#tg', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(4000);
  const play = await page.evaluate(async () => {
    const v = document.querySelector('video.tg-msg-video[data-proxy]');
    if (!v) return { found: false };
    v.src = v.dataset.proxy;
    await v.play().catch(() => {});
    await new Promise(r => setTimeout(r, 4000));
    return { found: true, ready: v.readyState, w: v.videoWidth, h: v.videoHeight, paused: v.paused, t: v.currentTime.toFixed(1) };
  });
  console.log('SMALL VIDEO:', JSON.stringify(play));
  await ctx.close();
}

await browser.close();
console.log('DONE');
