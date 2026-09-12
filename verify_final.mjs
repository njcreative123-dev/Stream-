import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const errs = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon') && !m.text().includes('net::ERR_')) errs.push('[err] ' + m.text().slice(0, 180)); });
  page.on('pageerror', e => errs.push('[pageerr] ' + String(e).slice(0, 180)));

  console.log('=== DESKTOP ===');
  // 1. Videos page
  await page.goto(BASE + '/videos', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  const vactive = await page.evaluate(() => Array.from(document.querySelectorAll('.page.active')).map(p => p.id));
  const vcards = await page.$$eval('#tgvGrid .lib-card', els => els.length).catch(() => 0);
  const vthumbs = await page.$$eval('#tgvGrid .lib-thumb', els => els.filter(i => i.naturalWidth > 0).length).catch(() => 0);
  console.log('[/videos]', vactive, '| cards:', vcards, '| thumbs loaded:', vthumbs);
  await page.screenshot({ path: 'FINAL_videos_desktop.png', fullPage: false });

  // 2. Play (mirrored long video)
  const playBtn = await page.$('#tgvGrid [data-libplay]');
  if (playBtn) {
    await playBtn.click();
    await page.waitForTimeout(5000);
    const modal = await page.$eval('#videoModal', el => !el.classList.contains('hide')).catch(() => false);
    const src = await page.$eval('#vmVideo', v => (v.currentSrc || v.src || '').slice(0, 140)).catch(() => '');
    console.log('[/videos] modal open:', modal, '| src:', src);
    await page.screenshot({ path: 'FINAL_videos_modal.png', fullPage: false });
    // close modal
    await page.evaluate(() => { try { closeVideoModal(); } catch(e){} });
  }

  // 3. Software page
  await page.goto(BASE + '/apk', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  const acards = await page.$$eval('#apkGrid .lib-card', els => els.length).catch(() => 0);
  console.log('[/apk] active:', await page.evaluate(() => Array.from(document.querySelectorAll('.page.active')).map(p => p.id)), '| cards:', acards);
  await page.screenshot({ path: 'FINAL_apk_desktop.png', fullPage: false });

  // 4. Roam movement on home
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  const rotxt = await page.evaluate(() => Array.from(document.querySelectorAll('.roam-agent')).filter(e => e.style.display !== 'none').map(e => e.id));
  console.log('[/] roam agents:', rotxt);
  await page.screenshot({ path: 'FINAL_home_roam.png', fullPage: false });

  // 5. Family room send test
  await page.goto(BASE + '/family', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  const famIn = await page.$('#famIn');
  if (famIn) {
    await famIn.fill('Final automated family test — human entry!');
    await famIn.press('Enter');
    await page.waitForTimeout(9000);
  }
  const famMsgs = await page.$$eval('#famMsgs .msg', els => els.length).catch(() => 0);
  console.log('[/family] messages:', famMsgs);
  await page.screenshot({ path: 'FINAL_family_sent.png', fullPage: false });
  await ctx.close();

  console.log('=== MOBILE ===');
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mctx.newPage();
  mp.on('pageerror', e => errs.push('[m-pageerr] ' + String(e).slice(0, 150)));
  await mp.goto(BASE + '/videos', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mp.waitForTimeout(5000);
  const mc = await mp.$$eval('#tgvGrid .lib-card', els => els.length).catch(() => 0);
  console.log('[mobile /videos] cards:', mc);
  await mp.screenshot({ path: 'FINAL_videos_mobile.png', fullPage: false });
  await mp.goto(BASE + '/apk', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mp.waitForTimeout(4000);
  const mac = await mp.$$eval('#apkGrid .lib-card', els => els.length).catch(() => 0);
  console.log('[mobile /apk] cards:', mac);
  await mp.screenshot({ path: 'FINAL_apk_mobile.png', fullPage: false });
  await mctx.close();

  await browser.close();
  console.log('\nERRORS:', errs.slice(0, 8));
  console.log('=== DONE ===');
})();
