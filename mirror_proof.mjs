import { chromium } from 'playwright';
const base = 'https://njsoft-stream.njcreative123.workers.dev';
const browser = await chromium.launch({ headless: true });

// Desktop: TG room numeric search + NJStream playback
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));
  await page.goto(base + '/#tg', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(4500);
  await page.fill('#tgSearch', '243902');
  await page.waitForTimeout(2500);
  const msgs = await page.locator('.tg-msg').count();
  const btn = await page.locator('.tg-msg:has-text("243902") .vbn-btn, .tg-msg video').count();
  const video = page.locator('.tg-msg video').first();
  let player = { found: false };
  if (await video.count() > 0) {
    player = await video.evaluate(async (v) => {
      await v.play().catch(() => {});
      await new Promise(r => setTimeout(r, 4000));
      return { found: true, src: (v.currentSrc || v.src || '').slice(0, 120), ready: v.readyState, w: v.videoWidth, h: v.videoHeight, paused: v.paused, t: +v.currentTime.toFixed(2) };
    });
  }
  await page.screenshot({ path: 'PROOF_media_search_play.png' });
  console.log('DESKTOP search 243902 | msgs:', msgs, '| actionable:', btn, '| player:', JSON.stringify(player));
  console.log('errors:', JSON.stringify(errors.filter(e => !/favicon/i.test(e))));
  await ctx.close();
}

// Download header proof
{
  const r = await fetch(base + '/api/media/243902?download=1', { method: 'GET', redirect: 'manual' });
  console.log('DOWNLOAD status:', r.status, '| content-disposition:', r.headers.get('content-disposition'), '| range headers:', r.headers.get('accept-ranges'));
  const rr = await fetch(base + '/api/media/243902?proxy=1', { headers: { Range: 'bytes=0-2047' } });
  console.log('RANGE status:', rr.status, '| content-range:', rr.headers.get('content-range'), '| len:', rr.headers.get('content-length'));
}

// Mobile view
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));
  await page.goto(base + '/#tg', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(4500);
  await page.fill('#tgSearch', '243902');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'PROOF_media_mobile.png', fullPage: true });
  const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  console.log('MOBILE msgs:', await page.locator('.tg-msg').count(), '| overflow:', JSON.stringify(overflow));
  console.log('MOBILE errors:', JSON.stringify(errors.filter(e => !/favicon/i.test(e))));
  await ctx.close();
}

await browser.close();
