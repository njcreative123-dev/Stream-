import { chromium } from 'playwright';
const url = 'https://njsoft-stream.njcreative123.workers.dev/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('requestfailed', r => errs.push('REQFAIL: ' + r.url() + ' ' + (r.failure()?.errorText || '')));
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);
const state = await page.evaluate(() => ({
  loaderClass: document.getElementById('loader')?.className,
  appClass: document.getElementById('app')?.className,
  activePage: document.querySelector('.page.active')?.id,
  appDisplay: getComputedStyle(document.getElementById('app')).display,
  appOpacity: getComputedStyle(document.getElementById('app')).opacity,
  bodyText: document.body.innerText.slice(0, 200)
}));
console.log('STATE:', JSON.stringify(state, null, 2));
console.log('ERRORS:', JSON.stringify(errs.slice(0, 15), null, 2));
await page.screenshot({ path: '/tmp/stuck_repro.png' });
await browser.close();
