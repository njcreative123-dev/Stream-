import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(3500);

// 1. DOM nesting check
const nest = await page.evaluate(() => {
  const pg = id => {
    const el = document.getElementById(id);
    if (!el) return null;
    const p = el.parentElement;
    return { id, parent: p ? (p.id || p.tagName) : 'null', active: el.classList.contains('active') };
  };
  return ['home','tv','tg','movies','books','tgv','apk','search','ai','family','nj','admin','catalog','login'].map(pg);
});
console.log('NESTING:', JSON.stringify(nest));

// 2. Visit EVERY page via sidebar, measure rects, screenshot
const pages = ['tv','movies','books','tg','search','af','catalog'];
const results = [];
for (const p of pages) {
  await page.evaluate((pgName) => {
    const btns = document.querySelectorAll('[data-nav]');
    let btn = null;
    btns.forEach(b => { if (b.getAttribute('data-nav') === pgName) btn = b; });
    if (btn) btn.click(); else { const hash = pgName==='af'?'af':pgName; location.hash = '#'+hash; }
  }, p).catch(()=>{});
  await page.waitForTimeout(2600);
  const r = await page.evaluate((pgName) => {
    const ids = pgName==='af' ? ['pg-ai','pg-family','pg-nj'] : ['pg-'+pgName];
    const out = {};
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) { out[id]='MISSING'; continue; }
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      out[id] = { active: el.classList.contains('active'), disp: cs.display, w: Math.round(b.width), h: Math.round(b.height), parent: el.parentElement.id };
    }
    return out;
  }, p);
  const shot = 'VERIFY_'+p+'.png';
  await page.screenshot({ path: shot });
  results.push({ page: p, rects: r, shot });
}
console.log(JSON.stringify(results, null, 1));
await browser.close();
