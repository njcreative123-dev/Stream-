import { chromium } from 'playwright';
const base = 'https://njsoft-stream.njcreative123.workers.dev';
const browser = await chromium.launch({ headless: true });
const cleanErrs = (errs) => errs.filter(e => !/favicon|401|403/i.test(e));
const activeAvatar = (page) => page.evaluate(() => {
  const sec = document.querySelector('section.page.active');
  if (!sec) return { active: false };
  const el = sec.querySelector('.agent3d .av-scene, .agent3d .av-char');
  if (!el) return { active: true, avatar: false };
  const r = el.getBoundingClientRect();
  return { active: true, avatar: true, w: Math.round(r.width), h: Math.round(r.height) };
});

// ---------- DESKTOP: click nav through all rooms ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));
  await page.goto(base + '/#home', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(1800);
  for (const r of ['home','tv','tg','movies','books','search','ai','nj']) {
    await page.click(`[data-nav="${r}"]`);
    await page.waitForTimeout(1800);
    const st = await activeAvatar(page);
    const msgs = r==='tg' ? await page.locator('#tgMessages .tg-msg').count() : -1;
    console.log(`DESKTOP ${r}:`, JSON.stringify(st), r==='tg'?`tgMsgs=${msgs}`:'');
  }
  console.log('DESKTOP errors:', JSON.stringify(cleanErrs(errors)));
  await ctx.close();
}

// ---------- MOBILE ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));

  // AI chat
  await page.goto(base + '/#ai', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(2500);
  const st = await activeAvatar(page);
  await page.evaluate(() => { document.querySelector('.chat-box')?.scrollIntoView({ block: 'center' }); });
  const rect = await page.evaluate(() => { const el = document.querySelector('.chat-input'); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight }; });
  let typed = false;
  try { await page.fill('#chatIn', 'Hello NJ'); typed = true; } catch (e) { console.log('TYPING FAIL:', e.message.split('\n')[0]); }
  console.log('MOBILE ai:', JSON.stringify(st), 'chat-input', JSON.stringify(rect), 'typed:', typed);
  await page.screenshot({ path: 'proof_mob_ai.png' });

  // TG
  await page.evaluate(() => { document.querySelector('[data-nav="tg"]')?.click(); });
  await page.waitForTimeout(3000);
  const before = await page.locator('#tgMessages .tg-msg').count();
  const btn = page.locator('button:has-text("Load More")');
  const btnCount = await btn.count();
  console.log('MOBILE tg: msgs=' + before + ' loadMoreBtns=' + btnCount);
  let after = before;
  if (btnCount > 0) {
    await btn.first().click();
    await page.waitForTimeout(3500);
    after = await page.locator('#tgMessages .tg-msg').count();
    console.log('MOBILE tg after click: msgs=' + after + ' ' + (after > before ? 'PAGINATION_OK' : 'NO_NEW'));
  }
  await page.screenshot({ path: 'proof_mob_tg.png', fullPage: true });
  console.log('MOBILE errors:', JSON.stringify(cleanErrs(errors)));
  await ctx.close();
}

await browser.close();
console.log('DONE');
