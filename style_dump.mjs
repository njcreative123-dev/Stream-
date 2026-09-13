import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(4000);
await page.evaluate(()=>document.querySelector('[data-nav="movies"]').click());
await page.waitForTimeout(3000);
const dump = await page.evaluate(() => {
  function styles(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { id, inline: el.getAttribute('style'), display: cs.display, position: cs.position, width: cs.width, height: cs.height, maxWidth: cs.maxWidth, minWidth: cs.minWidth, flex: cs.flex, transform: cs.transform, overflow: cs.overflow, opacity: cs.opacity, w: Math.round(r.width), h: Math.round(r.height), offsetParent: el.offsetParent ? el.offsetParent.id || el.offsetParent.tagName : 'null' };
  }
  const main = document.getElementById('main');
  const mainCs = getComputedStyle(main);
  return {
    home: styles('pg-home'),
    movies: styles('pg-movies'),
    main: { display: mainCs.display, flex: mainCs.flex, flexDirection: mainCs.flexDirection, width: mainCs.width, overflow: mainCs.overflow, position: mainCs.position, inline: main.getAttribute('style') },
    app: styles('app')
  };
});
console.log(JSON.stringify(dump, null, 1));
await browser.close();
