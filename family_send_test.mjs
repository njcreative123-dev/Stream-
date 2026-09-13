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
await page.evaluate(() => { const el=document.querySelector('[data-nav="af"]'); if(el) el.click(); });
await page.waitForTimeout(5000);
// Type into famIn and send
const typed = await page.evaluate(() => {
  const inp = document.getElementById('famIn');
  if (!inp) return 'no input';
  inp.value = 'Namaste family! Main ek visitor hun — aaj sabka plan kya hai?';
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  const btn = document.getElementById('famSend') || [...document.querySelectorAll('button')].find(b=>/Send ⚡/.test(b.textContent));
  if (btn) btn.click();
  return 'sent';
});
console.log('send:', typed);
await page.waitForTimeout(30000);
const res = await page.evaluate(() => {
  const box = document.getElementById('famBox') || document.body;
  const last = [...box.querySelectorAll('.fam-msg, [class*="fam"] [class*="msg"]')].slice(-3).map(m=>m.textContent.trim().slice(0,80));
  return JSON.stringify({ lastMsgs: last, msgCount: box.querySelectorAll('.fam-msg, [class*="fam"] [class*="msg"]').length, errText: document.body.textContent.includes('error') });
});
console.log('AF AFTER SEND:', res);
await page.screenshot({ path: 'FAMILY_after_send.png' });
console.log('errors:', errs.length ? errs.slice(0,6) : 'NONE');
await browser.close();
