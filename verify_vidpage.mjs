import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));

console.log('Loading...');
await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);

// Click Videos nav button
const vidBtn = page.locator('[data-nav="tgv"]');
console.log('Videos btn found:', await vidBtn.count());
if (await vidBtn.count()) {
  await vidBtn.click();
  await page.waitForTimeout(3000);
  const state = await page.evaluate(() => {
    const cards = document.querySelectorAll('.lib-card');
    const grid = document.getElementById('tgvGrid');
    const loading = grid ? grid.querySelector('.loading') : null;
    return {
      cards: cards.length,
      gridHTMLlen: grid ? grid.innerHTML.length : -1,
      gridText: grid ? grid.textContent.slice(0, 200) : 'no-grid',
      activePage: document.querySelector('.page.active')?.id
    };
  });
  console.log('Videos page state:', JSON.stringify(state, null, 1));
  await page.screenshot({ path: '/tmp/vidpage_1.png' });
  
  // Wait more for load
  await page.waitForTimeout(5000);
  const state2 = await page.evaluate(() => {
    const grid = document.getElementById('tgvGrid');
    return {
      cards: document.querySelectorAll('.lib-card').length,
      gridText: grid ? grid.textContent.slice(0, 150) : 'no-grid'
    };
  });
  console.log('After 5s more:', JSON.stringify(state2, null, 1));
  await page.screenshot({ path: '/tmp/vidpage_2.png' });
}

console.log('Errors:', errors.length ? errors.join('\n') : 'NONE');
await browser.close();
