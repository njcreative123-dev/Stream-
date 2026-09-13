import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const views = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
];
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
for (const v of views) {
  const page = await browser.newPage({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message.slice(0, 140)));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(9000);
  console.log(`[${v.name}] title=${await page.title()}`);
  const readyCards = await page.evaluate(() => document.querySelectorAll('#homeReady .lib-card').length);
  const navs = await page.evaluate(() => [...document.querySelectorAll('.nav-btn')].map(b => b.textContent.trim()).join(' | '));
  console.log(`[${v.name}] nav=${navs}`);
  console.log(`[${v.name}] homeReadyCards=${readyCards} errors=${errors.length ? errors.slice(0,2).join(' ;; ') : 'NONE'}`);
  await page.screenshot({ path: `REDESIGN_home_${v.name}.png` });
  // Movies & Videos page
  await page.evaluate(() => document.querySelector('[data-nav="movies"]').click());
  await page.waitForTimeout(8000);
  await page.screenshot({ path: `REDESIGN_movies_${v.name}.png` });
  // AI Family combined
  await page.evaluate(() => document.querySelector('[data-nav="af"]').click());
  await page.waitForTimeout(7000);
  const afVisible = await page.evaluate(() => ['pg-ai','pg-family','pg-nj'].every(id => document.getElementById(id) && document.getElementById(id).classList.contains('active')));
  console.log(`[${v.name}] afCombined=${afVisible} errors=${errors.length ? errors.slice(0,2).join(' ;; ') : 'NONE'}`);
  await page.screenshot({ path: `REDESIGN_affamily_${v.name}.png` });
  // Admin
  await page.evaluate(() => document.querySelector('[data-nav="admin"]').click());
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `REDESIGN_admin_${v.name}.png` });
  console.log(`[${v.name}] finalErrors=${errors.length ? errors.length : 'NONE'}`);
  await page.close();
}
await browser.close();
console.log('DONE');
