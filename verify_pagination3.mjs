import { chromium } from 'playwright';
const base = 'https://njsoft-stream.njcreative123.workers.dev';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));
const reqs = [];
page.on('request', r => { if (r.url().includes('/api/telegram/messages')) reqs.push(r.url()); });
page.on('response', async r => {
  if (r.url().includes('/api/telegram/messages')) {
    const t = await r.text();
    console.log('RESP', r.url().split('?')[1], '->', t.slice(0,120));
  }
});
await page.goto(base + '/#tg', { waitUntil: 'networkidle', timeout: 25000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Load More")').first().click();
await page.waitForTimeout(4000);
console.log('all tg msg requests:', reqs);
console.log('msg count now:', await page.locator('#tgMessages .tg-msg').count());
console.log('errors:', JSON.stringify(errors.filter(e => !/favicon|401|403/i.test(e))));
await browser.close();
