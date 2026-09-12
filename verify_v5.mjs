import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const errs = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon') && !m.text().includes('net::ERR')) errs.push('[err] ' + m.text().slice(0, 180)); });
  page.on('pageerror', e => errs.push('[pageerr] ' + String(e).slice(0, 180)));

  await page.goto(BASE + '/videos', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);
  console.log('[/videos] active:', await page.evaluate(() => Array.from(document.querySelectorAll('.page.active')).map(p => p.id)));
  const vcount = await page.$$eval('#tgvGrid .lib-card', els => els.length).catch(() => 0);
  console.log('[/videos] cards:', vcount);
  const thumbBroken = await page.$$eval('#tgvGrid .lib-thumb', els => els.filter(i => i.naturalWidth === 0).length).catch(() => -1);
  console.log('[/videos] broken thumbs:', thumbBroken);
  await page.screenshot({ path: 'LIB_videos_desktop_v2.png', fullPage: false });
  console.log('screenshot: LIB_videos_desktop_v2.png');

  // Try clicking first Play button
  const firstPlay = await page.$('#tgvGrid [data-libplay]');
  if (firstPlay) {
    const title = await firstPlay.getAttribute('data-libt');
    console.log('clicking Play for:', String(title).slice(0, 50));
    await firstPlay.click();
    await page.waitForTimeout(4000);
    const modalVisible = await page.$eval('#videoModal', el => !el.classList.contains('hide')).catch(() => false);
    console.log('video modal visible:', modalVisible);
    const vidSrc = await page.$eval('#vmVideo', v => v.currentSrc || v.src || '').catch(() => '');
    console.log('video source set:', vidSrc.slice(0, 120));
    await page.screenshot({ path: 'LIB_videos_playing.png', fullPage: false });
  }

  // API search/filter check
  await page.goto(BASE + '/apk', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  console.log('[/apk] active:', await page.evaluate(() => Array.from(document.querySelectorAll('.page.active')).map(p => p.id)));
  const acount = await page.$$eval('#apkGrid .lib-card', els => els.length).catch(() => 0);
  console.log('[/apk] cards:', acount);
  await page.screenshot({ path: 'LIB_apk_desktop_v2.png', fullPage: false });

  // Home page roam agents + movement screenshot
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  const roamVisible = await page.$$eval('.roam-agent', els => els.filter(e => e.style.display !== 'none').length).catch(() => 0);
  console.log('[/] visible roam agents:', roamVisible);
  await page.screenshot({ path: 'LIB_home_roam.png', fullPage: false });
  await ctx.close();

  // Mobile
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mctx.newPage();
  await mp.goto(BASE + '/videos', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mp.waitForTimeout(6000);
  const mvcount = await mp.$$eval('#tgvGrid .lib-card', els => els.length).catch(() => 0);
  console.log('[mobile /videos] cards:', mvcount);
  await mp.screenshot({ path: 'LIB_videos_mobile_v2.png', fullPage: false });
  await mctx.close();

  await browser.close();
  console.log('\nERRORS:', errs.slice(0, 8));
  console.log('=== DONE ===');
})();
