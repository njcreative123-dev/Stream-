import { chromium } from 'playwright';
const base = 'https://njsoft-stream.njcreative123.workers.dev';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));
await page.goto(base + '/#tg', { waitUntil: 'networkidle', timeout: 25000 });
await page.waitForTimeout(3000);
const btn = page.locator('button:has-text("Load More")');
console.log('loadMoreBtn count:', await btn.count());
if (await btn.count() > 0) {
  console.log('btn text:', (await btn.first().textContent()).trim());
  const before = await page.locator('#tgMessages .tg-msg').count();
  await btn.first().click();
  await page.waitForTimeout(4000);
  const after = await page.locator('#tgMessages .tg-msg').count();
  const firstMsg = await page.locator('#tgMessages .tg-msg').first().textContent();
  console.log('msgs before/after click:', before, after, after > before ? 'PAGINATION_OK' : 'NO_NEW');
  console.log('first msg snippet:', (firstMsg||'').trim().slice(0,80));
}
console.log('errors:', JSON.stringify(errors.filter(e => !/favicon|401|403/i.test(e))));
await page.screenshot({ path: 'proof_mob_tg_paged.png', fullPage: true });
await browser.close();
