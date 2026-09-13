import { chromium } from 'playwright';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(6000);
await page.screenshot({ path: 'MOBILE_home.png' });
await page.evaluate(() => document.querySelector('[data-nav="movies"]').click());
await page.waitForTimeout(6000);
await page.screenshot({ path: 'MOBILE_movies.png' });
await page.evaluate(() => document.querySelector('[data-nav="admin"]').click());
await page.waitForTimeout(4000);
await page.screenshot({ path: 'MOBILE_admin.png' });
// check computed layout
console.log(await page.evaluate(() => {
  const main = document.getElementById('main');
  const nav = document.querySelector('nav');
  return JSON.stringify({
    mainDisplay: getComputedStyle(main).display,
    mainWidth: main.getBoundingClientRect().width,
    mainLeft: main.getComputedStyle ? getComputedStyle(main).marginLeft : '?',
    navDisplay: getComputedStyle(nav).display,
    bodyScrollY: window.scrollY,
    active: [...document.querySelectorAll('.page.active')].map(p=>p.id)
  });
}));
await browser.close();
