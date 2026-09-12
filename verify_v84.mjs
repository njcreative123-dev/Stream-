import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const errs = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon') && !m.text().includes('net::ERR_') && !m.text().includes('SpeechRecognition')) errs.push('[err] ' + m.text().slice(0, 160)); });
  page.on('pageerror', e => errs.push('[pageerr] ' + String(e).slice(0, 160)));

  console.log('=== 1. LIVE TV — working channels only ===');
  await page.goto(BASE + '/tv', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4500);
  const tvTotal = await page.evaluate(() => (document.getElementById('tvTotal')||{}).textContent);
  const tvWorking = await page.evaluate(() => (document.getElementById('tvWorking')||{}).textContent);
  const tvCards = await page.$$eval('.tv-card', els => els.length);
  const tvDead = await page.$$eval('.tv-card.dead', els => els.length);
  console.log('total:', tvTotal, '| working:', tvWorking, '| cards shown:', tvCards, '| dead cards:', tvDead);
  await page.screenshot({ path: 'V84_tv.png' });

  console.log('=== 2. WALKING AGENTS — home ===');
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3500);
  const walkerCount = await page.$$eval('.walk-agent', els => els.filter(e => e.style.display !== 'none').length);
  const hasWalkAgent = await page.$$eval('.walk-agent', els => els.length);
  console.log('walk-agents total:', hasWalkAgent, '| visible:', walkerCount);
  const pos1 = await page.evaluate(() => Array.from(document.querySelectorAll('.walk-agent')).slice(0,2).map(e => ({ id:e.id, x:e.style.left })));
  await page.waitForTimeout(3000);
  const pos2 = await page.evaluate(() => Array.from(document.querySelectorAll('.walk-agent')).slice(0,2).map(e => ({ id:e.id, x:e.style.left })));
  const walked = pos1.some((p,i) => p.x !== pos2[i]?.x);
  console.log('positions moved:', walked, '| pos1:', JSON.stringify(pos1), '| pos2:', JSON.stringify(pos2));
  await page.screenshot({ path: 'V84_walkers_home.png' });

  console.log('=== 3. CLICK AGENT → wave + bubble + navigate ===');
  const njWalk = await page.$('#walk-nj');
  if (njWalk) {
    await njWalk.click();
    await page.waitForTimeout(800);
    const waveClass = await njWalk.evaluate(el => el.classList.contains('wave'));
    const bubbleText = await njWalk.evaluate(el => el.querySelector('.wa-bubble-txt')?.textContent || '');
    console.log('wave:', waveClass, '| bubble:', bubbleText.slice(0,50));
    await page.waitForTimeout(4000);
    const afterHash = await page.evaluate(() => location.hash);
    console.log('navigated to:', afterHash);
    await page.screenshot({ path: 'V84_agent_click.png' });
  }

  console.log('=== 4. MOVIES PAGE — Telegram tab ===');
  await page.goto(BASE + '/movies', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3500);
  const tgChip = await page.$('[data-mtype="tg"]');
  console.log('TG chip found:', !!tgChip);
  if (tgChip) await tgChip.click();
  await page.waitForTimeout(5500);
  const tgCards = await page.$$eval('#moviesGrid .lib-card', els => els.length).catch(() => 0);
  console.log('TG movie cards:', tgCards);
  await page.screenshot({ path: 'V84_movies_tg.png' });

  console.log('=== 5. VIDEOS PAGE ===');
  await page.goto(BASE + '/videos', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5500);
  const vidCards = await page.$$eval('#tgvGrid .lib-card', els => els.length).catch(() => 0);
  console.log('video cards:', vidCards);
  await page.screenshot({ path: 'V84_videos.png' });

  console.log('=== 6. MOBILE — walking agents ===');
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mctx.newPage();
  await mp.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mp.waitForTimeout(3500);
  const mwalkers = await mp.$$eval('.walk-agent', els => els.filter(e => e.style.display !== 'none').length);
  console.log('mobile walkers:', mwalkers);
  await mp.screenshot({ path: 'V84_mobile.png' });
  await mctx.close();

  await ctx.close();
  await browser.close();
  console.log('\nERRORS:', errs.slice(0, 10));
  console.log('=== DONE ===');
})();
