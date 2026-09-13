import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const browser = await chromium.launch({ executablePath: '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 300)); });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 40000 }).catch(()=>{});
await page.waitForTimeout(3000);

const pages = ['home','tv','movies','books','tg','family','search','ai'];
for (const name of pages) {
  const start = Date.now();
  await page.evaluate((n) => { const b = document.querySelector(`[data-nav="${n}"]`); if (b) b.click(); }, name).catch(()=>{});
  await page.waitForTimeout(name === 'tv' ? 8000 : name === 'movies' ? 8000 : 5000);
  const st = await page.evaluate((n) => {
    const p = document.getElementById(`pg-${n}`);
    const r = p ? p.getBoundingClientRect() : null;
    const cs = p ? getComputedStyle(p) : null;
    return {
      display: cs ? cs.display : 'MISSING-SECTION',
      opacity: cs ? cs.opacity : null,
      rectW: r ? Math.round(r.width) : 0,
      rectH: r ? Math.round(r.height) : 0,
      bodyScrollH: document.body.scrollHeight,
      title: document.title,
      hash: location.hash
    };
  }, name);
  await page.screenshot({ path: `V3_${name}.png` });
  console.log(`${name.toUpperCase()}: ${JSON.stringify(st)} (${Date.now()-start}ms)`);
}
console.log('ERRORS:', errs.length ? JSON.stringify(errs.slice(0,10)) : 'none');
await browser.close();
