import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errs = []; page.on('pageerror', e => errs.push(e.message.slice(0,120)));
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(4000);
await page.screenshot({ path: 'BOOST_mobile_home.png' });
// open sidebar
await page.evaluate(()=>document.getElementById('mtoggle').click());
await page.waitForTimeout(1200);
await page.screenshot({ path: 'BOOST_mobile_nav.png' });
// movies
await page.evaluate(()=>{const el=document.querySelector('[data-nav="movies"]'); if(el) el.click();});
await page.waitForTimeout(3000);
await page.screenshot({ path: 'BOOST_mobile_movies.png' });
// tv
await page.evaluate(()=>{const el=document.querySelector('[data-nav="tv"]'); if(el) el.click();});
await page.waitForTimeout(4000);
await page.screenshot({ path: 'BOOST_mobile_tv.png' });
// family
await page.evaluate(()=>{const el=document.querySelector('[data-nav="af"]'); if(el) el.click();});
await page.waitForTimeout(3000);
await page.screenshot({ path: 'BOOST_mobile_family.png' });
console.log('mobile screenshots done, errors:', errs.length);
errs.forEach(e=>console.log(e));
await browser.close();
