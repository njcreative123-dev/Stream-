import { chromium } from 'playwright';
const CHROME = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const URL = 'https://njsoft-stream.njcreative123.workers.dev/';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type()==='error') errors.push(m.text().slice(0,120)); });
page.on('pageerror', e => errors.push(String(e).slice(0,120)));
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(5000);
await page.click('#mtoggle', { timeout: 4000 }).catch(()=>console.log('no toggle'));
await page.waitForTimeout(600);
await page.click('.nav-btn[data-nav="tg"]', { timeout: 4000 }).catch(e=>console.log('nav click fail:', e.message.slice(0,60)));
await page.waitForTimeout(5000);
const stats = await page.evaluate(() => ({
  pageActive: document.querySelector('.page.active')?.id || 'none',
  cards: document.querySelectorAll('.movie-card').length,
  vids: document.querySelectorAll('.tg-msg-video').length,
  docRows: document.querySelectorAll('.doc-big-notice, .doc-row').length,
  tgMsgs: document.querySelectorAll('.tg-msg').length,
  inputs: document.querySelectorAll('input,textarea').length,
}));
console.log('TG page:', JSON.stringify(stats));
console.log('errors:', errors.length ? errors : 'NONE');
await page.screenshot({ path: 'shot_tg_page_mobile.png' });
await browser.close();
