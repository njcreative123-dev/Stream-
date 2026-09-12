import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const errs = [];
  
  // Desktop: /videos page
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errs.push('[D] ' + m.text().slice(0, 180)); });
  page.on('pageerror', e => errs.push('[D-pageerr] ' + String(e).slice(0, 180)));
  
  await page.goto(BASE + '/videos', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);
  console.log('[/videos] active:', await page.evaluate(() => Array.from(document.querySelectorAll('.page.active')).map(p => p.id)));
  console.log('[/videos] hash:', await page.evaluate(() => location.hash));
  const vcount = await page.$$eval('#tgvGrid .lib-card', els => els.length).catch(() => 0);
  console.log('[/videos] cards:', vcount);
  const roams = await page.$$eval('.roam-agent', els => els.filter(e => e.style.display !== 'none').length).catch(() => 0);
  console.log('[/videos] visible roam agents:', roams);
  await page.screenshot({ path: 'LIB_videos_desktop.png', fullPage: false });
  
  // open software
  await page.goto(BASE + '/apk', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  console.log('[/apk] active:', await page.evaluate(() => Array.from(document.querySelectorAll('.page.active')).map(p => p.id)));
  const acount = await page.$$eval('#apkGrid .lib-card', els => els.length).catch(() => 0);
  console.log('[/apk] cards:', acount);
  await page.screenshot({ path: 'LIB_apk_desktop.png', fullPage: false });
  
  // family page + roam
  await page.goto(BASE + '/family', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  console.log('[/family] active:', await page.evaluate(() => Array.from(document.querySelectorAll('.page.active')).map(p => p.id)));
  const roam2 = await page.$$eval('.roam-agent', els => els.filter(e => e.style.display !== 'none').length).catch(() => 0);
  console.log('[/family] visible roam agents:', roam2);
  await page.screenshot({ path: 'LIB_family_roam.png', fullPage: false });
  
  // Wait a bit and confirm roam agents MOVED (positions changed)
  const pos1 = await page.evaluate(() => Array.from(document.querySelectorAll('.roam-agent')).map(e => ({ id: e.id, left: e.style.left, top: e.style.top })));
  await page.waitForTimeout(5000);
  const pos2 = await page.evaluate(() => Array.from(document.querySelectorAll('.roam-agent')).map(e => ({ id: e.id, left: e.style.left, top: e.style.top })));
  const moved = pos1.some((p, i) => p.left !== (pos2[i] && pos2[i].left) || p.top !== (pos2[i] && pos2[i].top));
  console.log('[/family] roam agents moved after 5s:', moved);
  await ctx.close();
  
  // Mobile check
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mpage = await mctx.newPage();
  await mpage.goto(BASE + '/videos', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mpage.waitForTimeout(6000);
  const mvcount = await mpage.$$eval('#tgvGrid .lib-card', els => els.length).catch(() => 0);
  console.log('[mobile /videos] cards:', mvcount);
  await mpage.screenshot({ path: 'LIB_videos_mobile.png', fullPage: false });
  await mctx.close();
  
  await browser.close();
  console.log('\nERRORS:', errs.slice(0, 8));
  console.log('=== DONE ===');
})();
