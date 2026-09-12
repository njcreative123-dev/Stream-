import { chromium } from 'playwright';
const base = 'https://njsoft-stream.njcreative123.workers.dev';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(base + '/#tg', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(3000);
page.on('request', r => { if (r.url().includes('/api/telegram/messages?limit=150&offset=50')) console.log('TS', Date.now(), 'REQ offset=50'); });
page.on('response', async r => {
  if (r.url().includes('/api/telegram/messages')) {
    console.log('TS', Date.now(), 'RESP', r.url().split('?')[1], r.status());
  }
});
await page.locator('button:has-text("Load More")').first().click();
console.log('TS', Date.now(), 'clicked');
for (let i = 0; i < 6; i++) {
  await page.waitForTimeout(5000);
  const dbg = await page.evaluate(() => window.__tgDebug());
  console.log('TS', Date.now(), 't+'+((i+1)*5)+'s', JSON.stringify(dbg));
}
await browser.close();
