import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message.slice(0,150)));
await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(2000);
await page.evaluate(() => { const b = document.querySelector('[data-nav="movies"]'); if (b) b.click(); });
// wait for movie fetch + render
await page.waitForTimeout(8000);
const m = await page.evaluate(() => {
  const g = document.getElementById('moviesGrid');
  return {
    innerStart: g?.innerHTML?.slice(0, 200) || 'NO GRID',
    mediaCards: document.querySelectorAll('#moviesGrid .media-card').length,
    emptyShown: g?.querySelector('.empty') ? true : false,
    loading: g?.querySelector('.loading') ? true : false,
  };
});
console.log('MOVIES:', JSON.stringify(m));
await page.screenshot({ path: 'FINAL_movies_desktop.png' });

// Also test TG library tab on movies page
await page.evaluate(() => { const b = document.querySelector('[data-mtype="tg"]'); if (b) b.click(); });
await page.waitForTimeout(8000);
const m2 = await page.evaluate(() => {
  const g = document.getElementById('moviesGrid');
  return {
    libCards: document.querySelectorAll('#moviesGrid .lib-card, #moviesGrid [class*="lib-"]').length,
    innerHead: g?.innerHTML?.slice(0, 150) || 'NO GRID',
  };
});
console.log('MOVIES TG TAB:', JSON.stringify(m2));
await page.screenshot({ path: 'FINAL_movies_tg_tab.png' });
console.log('ERRORS:', JSON.stringify(errs.slice(0,3)));
await browser.close();
