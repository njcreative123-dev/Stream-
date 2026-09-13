import { chromium } from 'playwright';
const base = 'https://njsoft-stream.njcreative123.workers.dev';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 300)); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => errors.push('GOTO: ' + e.message));
await page.waitForTimeout(4000);
console.log('TITLE:', await page.title());
console.log('URL:', page.url());
// Try navigating via sidebar
for (const nav of ['tv','movies','books','ai','tg','search']) {
  try {
    await page.evaluate((n) => {
      const el = document.querySelector('[data-nav="'+n+'"]');
      if (el) el.click();
    }, nav);
    await page.waitForTimeout(2500);
    const h1 = await page.evaluate(() => {
      const h = document.querySelector('h1, .page-title, .section-title');
      const body = document.body.innerText.slice(0, 200);
      return { h: h ? h.innerText : '', body: body };
    });
    console.log('NAV['+nav+'] URL=' + page.url() + ' H1=' + h1.h.slice(0,80) + ' | BODY=' + h1.body.slice(0,120).replace(/\n/g,' '));
  } catch(e) {
    console.log('NAV['+nav+'] ERROR: ' + e.message.slice(0,200));
  }
}
console.log('ERRORS:');
errors.slice(0, 15).forEach(e => console.log('  ' + e));
await page.screenshot({ path: '/tmp/audit_final.png', fullPage: false });
await browser.close();
