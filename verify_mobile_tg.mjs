import { chromium } from 'playwright';
const base = 'https://njsoft-stream.njcreative123.workers.dev';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));
await page.goto(base + '/#ai', { waitUntil: 'networkidle', timeout: 25000 });
await page.waitForTimeout(2000);

// log which page is active before clicking
console.log('active before:', await page.evaluate(() => document.querySelector('.page.active')?.id || 'none'));

// try hamburger + click
await page.click('#mtoggle');
await page.waitForTimeout(300);
const sideOpen = await page.evaluate(() => document.querySelector('#side')?.classList.contains('open'));
console.log('side open after toggle:', sideOpen);
await page.click('[data-nav="tg"]');
await page.waitForTimeout(3500);

console.log('active after click:', await page.evaluate(() => document.querySelector('.page.active')?.id || 'none'));
console.log('tgMessages innerHTML len:', await page.evaluate(() => document.getElementById('tgMessages')?.innerHTML.length || 0));
const msgCount = await page.locator('#tgMessages .tg-msg').count();
console.log('tg-msg count:', msgCount);
const allChildren = await page.evaluate(() => document.getElementById('tgMessages')?.children.length || 0);
console.log('tgMessages children:', allChildren);

// check hash
console.log('hash:', await page.evaluate(() => location.hash));
console.log('state.page:', await page.evaluate(() => typeof state !== 'undefined' ? state.page : 'undef'));
console.log('errors:', JSON.stringify(errors.filter(e => !/favicon|401|403/i.test(e))));
await browser.close();
