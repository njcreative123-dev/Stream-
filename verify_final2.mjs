import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const errs = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon') && !m.text().includes('net::ERR_') && !m.text().includes('SpeechRecognition')) errs.push('[err] ' + m.text().slice(0, 140)); });
  page.on('pageerror', e => errs.push('[pageerr] ' + String(e).slice(0, 140)));

  // 1. TV — only working channels
  await page.goto(BASE + '/tv', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  const tvInfo = await page.evaluate(() => ({
    total: (document.getElementById('tvTotal')||{}).textContent,
    working: (document.getElementById('tvWorking')||{}).textContent,
    cards: document.querySelectorAll('.tv-card').length,
    dead: document.querySelectorAll('.tv-card.dead').length,
  }));
  console.log('TV:', JSON.stringify(tvInfo));
  await page.screenshot({ path: 'P2_tv_working.png' });

  // 2. Home walkers + movement + dispatch click
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  const walkers = await page.evaluate(() => Array.from(document.querySelectorAll('.walk-agent')).filter(e => e.style.display !== 'none').map(e => e.id));
  console.log('walkers visible:', walkers);
  const x1 = await page.evaluate(() => document.querySelector('#walk-telly')?.style.left || '');
  await page.waitForTimeout(3200);
  const x2 = await page.evaluate(() => document.querySelector('#walk-telly')?.style.left || '');
  console.log('telly moved:', x1, '->', x2, '| moved:', x1 !== x2);
  await page.screenshot({ path: 'P2_home_walkers.png' });

  // dispatch click (bypasses Playwright stability check)
  await page.evaluate(() => document.querySelector('#walk-nj').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(1000);
  const bubble = await page.evaluate(() => document.querySelector('#walk-nj .wa-bubble-txt')?.textContent || '');
  const wave = await page.evaluate(() => document.querySelector('#walk-nj').classList.contains('wave'));
  console.log('click → wave:', wave, '| bubble:', bubble.slice(0, 50));
  await page.screenshot({ path: 'P2_agent_think.png' });
  await page.waitForTimeout(4200);
  console.log('after click hash:', await page.evaluate(() => location.hash));

  // 3. Movies TG tab
  await page.goto(BASE + '/movies', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  const tgChip = await page.$('[data-mtype="tg"]');
  if (tgChip) await tgChip.click();
  await page.waitForTimeout(5500);
  const tgCards = await page.$$eval('#moviesGrid .lib-card', els => els.length).catch(() => 0);
  const tgThumbs = await page.$$eval('#moviesGrid .lib-thumb', els => els.filter(i => i.complete).length).catch(() => 0);
  console.log('Movies TG tab cards:', tgCards, '| thumbs:', tgThumbs);
  await page.screenshot({ path: 'P2_movies_tg.png' });

  // 4. Videos + Software
  await page.goto(BASE + '/videos', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  console.log('Videos cards:', await page.$$eval('#tgvGrid .lib-card', els => els.length).catch(() => 0));
  await page.goto(BASE + '/apk', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  console.log('APK cards:', await page.$$eval('#apkGrid .lib-card', els => els.length).catch(() => 0));

  // 5. Mobile
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mctx.newPage();
  await mp.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mp.waitForTimeout(3500);
  const mv = await mp.$$eval('.walk-agent', els => els.filter(e => e.style.display !== 'none').length);
  console.log('mobile walkers:', mv);
  await mp.screenshot({ path: 'P2_mobile_walkers.png' });
  await mctx.close();

  await ctx.close();
  await browser.close();
  console.log('ERRORS:', errs.slice(0, 10));
  console.log('=== ALL DONE ===');
})();
