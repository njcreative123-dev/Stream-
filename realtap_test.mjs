import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errs = [];
page.on('console', m => { if (m.type()==='error') errs.push('C:' + m.text().slice(0,150)); });
page.on('pageerror', e => errs.push('PE:' + e.message.slice(0,200)));
page.on('requestfailed', r => errs.push('RF:' + r.url().slice(0,100) + ' ' + (r.failure()?.errorText||'')));
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(5000);
// home screenshot
await page.screenshot({ path: 'USERTEST_1_home.png' });
console.log('HOME loaded, errors so far:', errs.length);
// REAL TAP on hamburger
const tg = await page.evaluate(() => {
  const t = document.getElementById('mtoggle');
  if (!t) return null;
  const r = t.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width, h: r.height };
});
if (tg) {
  await page.touchscreen.tap(tg.x, tg.y);
  await page.waitForTimeout(1200);
  console.log('HAMBURGER tapped');
  await page.screenshot({ path: 'USERTEST_2_sidebar.png' });
}
// REAL TAP on Movies nav button
const nav = await page.evaluate(() => {
  const b = document.querySelector('[data-nav="movies"]');
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2 };
});
if (nav) {
  await page.touchscreen.tap(nav.x, nav.y);
  await page.waitForTimeout(6000);
  console.log('MOVIES tapped');
  const st = await page.evaluate(() => {
    const a = document.querySelector('section.page.active');
    if (!a) return 'NO ACTIVE';
    const r = a.getBoundingClientRect();
    const cs = getComputedStyle(a);
    return {
      id: a.id,
      display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
      rectVisible: r.width > 10 && r.height > 10,
      children: a.children.length,
      textPreview: (a.innerText || '').slice(0,80).replace(/\s+/g,' ')
    };
  });
  console.log('MOVIES STATE:', JSON.stringify(st, null, 1));
  await page.screenshot({ path: 'USERTEST_3_movies.png' });
}
// REAL TAP on TV
const nav2 = await page.evaluate(() => {
  const b = document.querySelector('[data-nav="tv"]');
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2 };
});
if (nav2) {
  await page.touchscreen.tap(nav2.x, nav2.y);
  await page.waitForTimeout(6000);
  const st = await page.evaluate(() => {
    const a = document.querySelector('section.page.active');
    if (!a) return 'NO ACTIVE';
    return { id: a.id, children: a.children.length, text: (a.innerText||'').slice(0,60).replace(/\s+/g,' ') };
  });
  console.log('TV STATE:', JSON.stringify(st));
  await page.screenshot({ path: 'USERTEST_4_tv.png' });
}
console.log('TOTAL ERRORS:', errs.length);
errs.slice(0,15).forEach(e => console.log('  ', e));
await browser.close();
