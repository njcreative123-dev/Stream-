import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const errs = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('[pageerr] ' + String(e).slice(0, 160)));

  // 1. TV screenshot
  await page.goto(BASE + '/tv', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4500);
  await page.screenshot({ path: 'V84_tv_working_only.png' });
  const tvDead = await page.$$eval('.tv-card.dead', els => els.length).catch(() => -1);
  const tvTotal = await page.evaluate(() => (document.getElementById('tvTotal')||{}).textContent);
  console.log('TV: total displayed=', tvTotal, 'dead=', tvDead);

  // 2. Home walkers
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'V84_home_walkers.png' });

  // 3. Click agent with force
  const nj = await page.$('#walk-nj');
  if (nj) {
    await nj.click({ force: true });
    await page.waitForTimeout(800);
    const bubble = await page.evaluate(() => document.querySelector('#walk-nj .wa-bubble-txt')?.textContent || '');
    console.log('NJ click bubble:', bubble.slice(0, 60));
    await page.waitForTimeout(4000);
    const hash = await page.evaluate(() => location.hash);
    console.log('after click hash:', hash);
    await page.screenshot({ path: 'V84_agent_click_result.png' });
  }

  // 4. Movies TG tab
  await page.goto(BASE + '/movies', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  const tgChip = await page.$('[data-mtype="tg"]');
  if (tgChip) await tgChip.click();
  await page.waitForTimeout(5500);
  const movieTGCards = await page.$$eval('#moviesGrid .lib-card', els => els.length).catch(() => 0);
  console.log('Movies TG tab cards:', movieTGCards);
  await page.screenshot({ path: 'V84_movies_tg_tab.png' });

  // 5. Videos page
  await page.goto(BASE + '/videos', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5500);
  const vidCards = await page.$$eval('#tgvGrid .lib-card', els => els.length).catch(() => 0);
  console.log('Videos page cards:', vidCards);
  await page.screenshot({ path: 'V84_videos_page.png' });

  // 6. Family room
  await page.goto(BASE + '/family', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  const famActive = await page.evaluate(() => Array.from(document.querySelectorAll('.page.active')).map(p => p.id));
  console.log('Family active:', famActive);
  await page.screenshot({ path: 'V84_family.png' });

  // 7. Mobile TV
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mctx.newPage();
  await mp.goto(BASE + '/tv', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mp.waitForTimeout(4500);
  await mp.screenshot({ path: 'V84_mobile_tv.png' });
  await mp.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mp.waitForTimeout(3500);
  const mw = await mp.$$eval('.walk-agent', els => els.filter(e => e.style.display !== 'none').length);
  console.log('mobile walkers:', mw);
  await mp.screenshot({ path: 'V84_mobile_walkers.png' });
  await mctx.close();

  await ctx.close();
  await browser.close();
  console.log('ERRORS:', errs.slice(0, 8));
  console.log('=== ALL DONE ===');
})();
