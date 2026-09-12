import { chromium } from 'playwright';
const base = 'https://njsoft-stream.njcreative123.workers.dev';
const browser = await chromium.launch({ headless: true });

const cleanErrs = (errs) => errs.filter(e => !/favicon|401|403/i.test(e));

// ---------- DESKTOP: all 7 rooms ----------
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
      const el = document.querySelector('.av-avatar');
      if (!el) return { present: false };
      const r = el.getBoundingClientRect();
      return { present: true, w: Math.round(r.width), h: Math.round(r.height), src: (el.style.backgroundImage||el.querySelector('img')?.src||'').slice(0,60) };
    });
    const title = await page.evaluate(() => (document.querySelector('.agent-name, h1, .hero h1, .page-title')?.textContent || '').trim().slice(0,40));
    const inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input, textarea')).filter(i => i.offsetParent !== null).length);
    console.log(`DESKTOP #${r}: avatar=${av.present?'OK':'MISSING'} ${av.w}x${av.h} | title="${title}" | visibleInputs=${inputs}`);
  }
  console.log('DESKTOP errors:', JSON.stringify(cleanErrs(errors)));
  await ctx.close();
}

// ---------- MOBILE 390x844: AI chat visible + typing ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));
  await page.goto(base + '/#ai', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => { document.querySelector('.chat-box')?.scrollIntoView({ block: 'center' }); });
  const rect = await page.evaluate(() => { const el = document.querySelector('.chat-input'); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight }; });
  console.log('MOBILE ai chat-input rect:', JSON.stringify(rect));
  let typed = false;
  try { await page.fill('#chatIn', 'Hello NJ'); typed = true; } catch (e) { console.log('TYPING FAIL:', e.message.split('\n')[0]); }
  console.log('MOBILE ai typed:', typed);
  console.log('MOBILE avatars on ai page:', await page.locator('.av-avatar').count());
  await page.screenshot({ path: 'proof_mob_ai.png', fullPage: false });
  await ctx.close();
}

// ---------- MOBILE: TG pagination ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));
  await page.goto(base + '/#tg', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(3000);
  const before = await page.locator('#tgList .tg-msg, #tgList .tg-msg-card, #tgList .tg-card').count();
  const btnCount = await page.locator('button:has-text("Load More")').count();
  console.log('MOBILE tg before / load-more btns:', before, btnCount);
  if (btnCount > 0) {
    await page.locator('button:has-text("Load More")').first().click();
    await page.waitForTimeout(2500);
    const after = await page.locator('#tgList .tg-msg, #tgList .tg-msg-card, #tgList .tg-card').count();
    console.log('MOBILE tg after click:', after, after > before ? 'PAGINATION_OK' : 'NO_NEW');
    await page.screenshot({ path: 'proof_mob_tg.png', fullPage: false });
  }
  console.log('MOBILE tg errors:', JSON.stringify(cleanErrs(errors)));
  await ctx.close();
}

await browser.close();
console.log('DONE');
