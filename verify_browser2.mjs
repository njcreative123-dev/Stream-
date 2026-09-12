import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text().slice(0,200)); });
page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message.slice(0,200)));

// Home
console.log('=== HOME ===');
await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);
const loaderVisible = await page.evaluate(() => {
  const l = document.querySelector('.loader, #loader, .loading-screen');
  if (!l) return false;
  const s = getComputedStyle(l);
  return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
});
const famWallMembers = await page.evaluate(() => {
  const el = document.querySelector('#famWall');
  if (!el) return 'NO WALL';
  return el.querySelectorAll('.agent3d, .member, .fam-member').length;
});
const allAgents = await page.$$('.agent3d');
const homeText = await page.evaluate(() => document.body.innerText.slice(0, 300));
await page.screenshot({ path: '/root/johnny.heliohost./verify_home2.png' });
console.log(`Loader visible: ${loaderVisible}`);
console.log(`FamWall members: ${famWallMembers}`);
console.log(`Total .agent3d: ${allAgents.length}`);
console.log(`Body text head: ${homeText.replace(/\n/g,' | ').slice(0,200)}`);

// TV room with long wait
console.log('=== TV ===');
await page.goto('https://njsoft-stream.njcreative123.workers.dev/#tv', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(12000);
const tvCards = await page.$$('[data-chan]');
const tvText = await page.evaluate(() => document.body.innerText.slice(0, 250));
await page.screenshot({ path: '/root/johnny.heliohost./verify_tv2.png' });
console.log(`TV cards: ${tvCards.length}`);
console.log(`TV text: ${tvText.replace(/\n/g,' | ').slice(0,200)}`);

// Consoles
console.log('=== ERRORS ===');
if (errors.length === 0) console.log('None');
else errors.forEach(e => console.log('- ' + e));
await browser.close();
console.log('DONE');
