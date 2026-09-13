import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message.slice(0,150)));
await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(2000);

// Navigate to AF (AI + Family + NJ)
await page.evaluate(() => { const b = document.querySelector('[data-nav="af"]'); if (b) b.click(); });
await page.waitForTimeout(1500);
const tabs = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('[data-af]')].map(b => b.getAttribute('data-af'));
  return btns;
});
console.log('AF tabs:', JSON.stringify(tabs));

// Click family
await page.evaluate(() => { const b = document.querySelector('[data-af="family"]'); if (b) b.click(); });
await page.waitForTimeout(2000);
const famState = await page.evaluate(() => {
  const pg = document.getElementById('pg-family');
  const r = pg?.getBoundingClientRect();
  return {
    w: r?.width, h: r?.height, active: pg?.classList.contains('active'),
    chatHtml: document.getElementById('familyChat')?.innerHTML?.slice(0, 200) || 'NO familyChat',
    msgList: document.getElementById('familyMessages')?.children?.length ?? -1,
    input: !!document.querySelector('#familyMessages + input, #pg-family input[type="text"], #pg-family textarea'),
  };
});
console.log('FAMILY:', JSON.stringify(famState));
await page.screenshot({ path: 'E2E_family_state.png' });

// Wait for AI messages to appear
await page.waitForTimeout(10000);
const afterWait = await page.evaluate(() => {
  const list = document.getElementById('familyMessages');
  return {
    msgs: list ? list.children.length : -1,
    lastText: list?.lastChild?.textContent?.slice(0, 100) || '',
    loading: document.querySelector('#pg-family .loading, #pg-family .bubble-loading') ? 'yes' : 'no',
  };
});
console.log('AFTER WAIT:', JSON.stringify(afterWait));
console.log('ERRORS:', JSON.stringify(errs.slice(0,5)));
await page.screenshot({ path: 'E2E_family_after_wait.png' });
await browser.close();
