import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const logs = [];
page.on('pageerror', e => logs.push('PAGEERR: ' + e.message.slice(0,150)));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type().toUpperCase() + ': ' + m.text().slice(0,200)); });
page.on('requestfailed', r => logs.push('REQFAIL: ' + r.url().slice(-80) + ' :: ' + (r.failure()?.errorText || '')));
await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(2500);
// capture fetch responses for movies API
await page.evaluate(() => {
  window.__fetches = [];
  const orig = window.fetch;
  window.fetch = function(...args){
    const u = String(args[0]);
    if (u.includes('/api/')) {
      const p = fetch(...args).then(r => { window.__fetches.push(u.slice(-60) + ' -> ' + r.status); return r; }).catch(e => { window.__fetches.push(u.slice(-60) + ' -> ERR ' + e.message); throw e; });
      return p;
    }
    return orig.apply(this, args);
  };
});
await page.evaluate(() => { const b = document.querySelector('[data-nav="movies"]'); if (b) b.click(); });
await page.waitForTimeout(8000);
const result = await page.evaluate(() => ({
  fetches: window.__fetches || [],
  gridInner: document.getElementById('moviesGrid')?.innerHTML?.slice(0,300) || 'NO GRID',
  gridKids: document.getElementById('moviesGrid')?.children?.length || 0,
}));
console.log('RESULT:', JSON.stringify(result));
console.log('LOGS:', JSON.stringify(logs.slice(0,8), null, 1));
await browser.close();
