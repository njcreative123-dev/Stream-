import { chromium } from 'playwright';

const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';

const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', err => consoleErrors.push('PAGEERROR: ' + err.message));

try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('--- Page loaded, waiting 3s ---');
  await page.waitForTimeout(3000);
  
  const loaderVisible = await page.evaluate(() => {
    const l = document.getElementById('loader');
    return l ? getComputedStyle(l).display !== 'none' && getComputedStyle(l).opacity !== '0' : 'no-loader';
  });
  console.log('Loader visible:', loaderVisible);
  
  const activePage = await page.evaluate(() => {
    const ap = document.querySelector('.page.active');
    return ap ? ap.id : 'none';
  });
  console.log('Active page:', activePage);
  
  const appVisible = await page.evaluate(() => {
    const ap = document.getElementById('app');
    return ap ? getComputedStyle(ap).opacity : 'no-app';
  });
  console.log('App opacity:', appVisible);
  
  // Test typing in search
  await page.click('[data-nav="search"]').catch(() => console.log('CANT CLICK search'));
  await page.waitForTimeout(500);
  await page.fill('#searchInput', 'Golmaal').catch(e => console.log('CANT TYPE search:', e.message));
  await page.waitForTimeout(1000);
  const searchVal = await page.evaluate(() => document.getElementById('searchInput')?.value);
  console.log('Search input value:', searchVal);
  
  // Test family room
  await page.click('[data-nav="family"]').catch(() => console.log('CANT CLICK family'));
  await page.waitForTimeout(1500);
  const familyInput = await page.evaluate(() => document.getElementById('familyChatIn') ? document.getElementById('familyChatIn').offsetParent !== null : false);
  console.log('Family chat input visible:', familyInput);
  await page.fill('#familyChatIn', 'Hello agents!').catch(e => console.log('CANT TYPE family:', e.message));
  await page.waitForTimeout(300);
  const famVal = await page.evaluate(() => document.getElementById('familyChatIn')?.value);
  console.log('Family input value:', famVal);
  
  // Screenshot
  await page.screenshot({ path: '/tmp/current_state.png', fullPage: false });
  console.log('--- Console errors (' + consoleErrors.length + ') ---');
  consoleErrors.slice(0, 10).forEach(e => console.log('ERR:', e));
  
} catch (e) {
  console.log('TEST FAILED:', e.message);
}

await browser.close();
