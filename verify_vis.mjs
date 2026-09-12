import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', m => { if (m.type()==='error' || m.type()==='warning') errors.push(m.type()+': '+m.text().slice(0,200)); });
page.on('pageerror', e => errors.push('PAGEERR: '+e.message.slice(0,200)));
await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);
// Check loader visibility & app visibility
const st = await page.evaluate(() => {
  const l = document.getElementById('loader');
  const app = document.getElementById('app') || document.querySelector('.app');
  const loaderVisible = l ? (getComputedStyle(l).opacity !== '0' && getComputedStyle(l).display !== 'none') : 'no-el';
  const appVisible = app ? getComputedStyle(app).display : 'no-el';
  return { loaderVisible, appVisible, bodyText: document.body.innerText.slice(0,150) };
});
console.log('STATE:', JSON.stringify(st, null, 1));
console.log('ERRORS (' + errors.length + '):');
errors.slice(0,15).forEach(e => console.log(' -', e));
await page.screenshot({ path: '/root/johnny.heliohost./tmp_vis.png', fullPage: false });
await browser.close();
