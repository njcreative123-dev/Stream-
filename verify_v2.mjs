import { chromium } from 'playwright';
const base = 'https://njsoft-stream.njcreative123.workers.dev';
const browser = await chromium.launch({ headless: true });
const cleanErrs = (errs) => errs.filter(e => !/favicon|401|403/i.test(e));

// ---------- DESKTOP: all 7 rooms + avatars ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));
  await page.goto(base + '/#home', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(1800);
  const rooms = ['home','tv','tg','movies','books','search','ai','nj'];
  for (const r of rooms) {
    await page.evaluate((r) => { location.hash = r; }, r);
    await page.waitForTimeout(1600);
    const av = await page.evaluate(() => {
      const el = document.querySelector('.agent3d .av-scene, .agent3d .av-char');
      if (!el) return { present: false };
      const r = el.getBoundingClientRect();
      return { present: true, w: Math.round(r.width), h: Math.round(r.height) };
    });
    const slots = await page.locator('.agent3d[data-avatar]').count();
    console.log(`DESKTOP #${r}: agent3dSlots=${slots} avatar=${av.present?'OK':'MISSING'} ${av.w}x${av.h}`);
  }
  console.log('DESKTOP errors:', JSON.stringify(cleanErrs(errors)));
  await page.screenshot({ path: 'proof_desktop_home.png' });
  await ctx.close();
}

// ---------- MOBILE 390x844 ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));

  // AI chat
  await page.goto(base + '/#ai', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => { document.querySelector('.chat-box')?.scrollIntoView({ block: 'center' }); });
  const rect = await page.evaluate(() => { const el = document.querySelector('.chat-input'); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight }; });
  let typed = false;
  try { await page.fill('#chatIn', 'Hello NJ'); typed = true; } catch (e) { console.log('TYPING FAIL:', e.message.split('\n')[0]); }
  console.log('MOBILE ai: chat-input', JSON.stringify(rect), '| typed:', typed, '| avatars:', await page.locator('.agent3d .av-char').count());
  await page.screenshot({ path: 'proof_mob_ai.png' });

  // TG pagination
  await page.goto(base + '/#tg', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(3000);
  const before = await page.locator('#tgMessages .tg-msg').count();
  const btn = page.locator('button:has-text("Load More")');
  const btnCount = await btn.count();
  console.log('MOBILE tg: msgs=' + before + ' loadMoreBtns=' + btnCount);
  let after = before;
  if (btnCount > 0) {
    await btn.first().click();
    await page.waitForTimeout(3000);
    after = await page.locator('#tgMessages .tg-msg').count();
    console.log('MOBILE tg after click: msgs=' + after + ' ' + (after > before ? 'PAGINATION_OK' : 'NO_NEW'));
  }
  await page.screenshot({ path: 'proof_mob_tg.png' });
  console.log('MOBILE errors:', JSON.stringify(cleanErrs(errors)));
  await ctx.close();
}

await browser.close();
console.log('DONE');
