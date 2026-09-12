import { chromium } from 'playwright';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
const errs = [];
page.on('console', m => { if(m.type()==='error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PE:'+e.message));
await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(5000);
const info = await page.evaluate(() => {
  const l = document.getElementById('loader');
  const a = document.getElementById('app');
  const p = document.querySelector('.page.active');
  const fc = document.getElementById('familyChatIn');
  return {
    loaderHidden: l ? (l.style.display==='none' || l.classList.contains('hide') || getComputedStyle(l).opacity==='0') : 'n/a',
    appVisible: a ? getComputedStyle(a).opacity : 'n/a',
    activePage: p ? p.id : 'none',
    familyInputExists: !!fc,
  };
});
console.log('INFO:', JSON.stringify(info));
console.log('ERRORS:', JSON.stringify(errs.slice(0,5)));
await page.screenshot({ path: '/tmp/nj_current.png' });
await browser.close();
