import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
page.on('console', m => { if (m.type()==='error') errs.push(m.text().slice(0,120)); });
page.on('pageerror', e => errs.push('PE: '+e.message.slice(0,120)));
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(4000);
// Navigate to AF / family
await page.evaluate(() => { const el=document.querySelector('[data-nav="af"]'); if(el) el.click(); else console.log('AF nav missing, trying family'); });
await page.waitForTimeout(5000);
const ui = await page.evaluate(() => {
  const input = document.getElementById('famInput') || document.querySelector('#afChat input, #familyChat input, [id*="fam" i] input, textarea');
  const send = document.getElementById('famSend') || [...document.querySelectorAll('button')].find(b=>/send|bhejo|bolo|likho/i.test(b.textContent));
  const msgs = document.querySelectorAll('.fam-msg, [class*="fam"] [class*="msg"]').length;
  const loading = document.body.textContent.includes('buffering') || document.body.textContent.includes('Loading');
  return JSON.stringify({ page: location.hash || location.pathname, input: !!input, inputId: input? input.id||input.className||'anon':null, sendBtn: send? send.textContent.trim().slice(0,20):false, msgs, loadingVisible: loading });
});
console.log('AF UI:', ui);
await page.screenshot({ path: 'FAMILY_browser_state.png' });
console.log('errors:', errs.length ? errs.slice(0,6) : 'NONE');
await browser.close();
