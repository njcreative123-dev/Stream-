import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(4000);
await page.evaluate(()=>document.querySelector('[data-nav="movies"]').click());
await page.waitForTimeout(3000);
const dbg = await page.evaluate(() => {
  const m = document.getElementById('main');
  const a = document.getElementById('pg-movies');
  const mr = m.getBoundingClientRect();
  const ar = a.getBoundingClientRect();
  const kids = [...a.children].map(c => {
    const r = c.getBoundingClientRect();
    return { tag: c.tagName, cls: (c.className||'').toString().slice(0,30), w: Math.round(r.width), h: Math.round(r.height), disp: getComputedStyle(c).display, pos: getComputedStyle(c).position };
  });
  const elAtMid = document.elementFromPoint(640, 400);
  return {
    mainRect: { x: Math.round(mr.x), y: Math.round(mr.y), w: Math.round(mr.width), h: Math.round(mr.height), ch: m.clientHeight, sh: m.scrollHeight },
    pageRect: { w: Math.round(ar.width), h: Math.round(ar.height) },
    kids: kids.slice(0, 6),
    elAtMid: elAtMid ? (elAtMid.tagName + '.' + (elAtMid.className||'').toString().slice(0,40)) : 'null',
    contentVisibility: getComputedStyle(a).contentVisibility,
    contain: getComputedStyle(a).contain
  };
});
console.log(JSON.stringify(dbg, null, 1));
await browser.close();
