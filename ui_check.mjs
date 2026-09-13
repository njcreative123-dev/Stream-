import { chromium } from 'playwright';
const CHROME = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
async function shot(name, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0,140)); });
  page.on('pageerror', e => errors.push(String(e).slice(0,140)));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  // home
  await page.screenshot({ path: `/root/johnny.heliohost./UI_${name}_home.png`, fullPage: false });
  const homeH = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 2 ? 'OVERFLOW-X' : 'ok');
  const amt = await page.$$eval('nav .nav-btn', els => els.length);
  const off = await page.evaluate(() => {
    const els = [...document.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.right > window.innerWidth + 5 || r.left < -5; });
    return els.slice(0,3).map(e => e.tagName + '.' + (e.className||'').toString().slice(0,40));
  });
  // tv page
  await page.click('[data-nav="tv"]').catch(()=>{});
  await page.waitForSelector('#tvGrid .tv-card', { timeout: 45000 }).catch(()=>{});
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `/root/johnny.heliohost./UI_${name}_tv.png`, fullPage: false });
  const cards = await page.$$eval('#tvGrid .tv-card', els => els.length).catch(()=>0);
  const chips = await page.$$eval('#tvFilters .chip', els => els.length).catch(()=>0);
  await page.close();
  return { name, viewport, errors: errors.slice(0,4), overflowX: homeH, navBtns: amt, overflowEls: off.slice(0,2), tvCards: cards, tvChips: chips };
}
const res = [];
res.push(await shot('desktop', { width: 1280, height: 800 }));
res.push(await shot('mobile', { width: 390, height: 844 }));
res.push(await shot('tablet', { width: 820, height: 1180 }));
console.log(JSON.stringify(res, null, 1));
await browser.close();
