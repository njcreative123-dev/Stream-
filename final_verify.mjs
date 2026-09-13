import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errs=[]; page.on('pageerror',e=>errs.push(e.message.slice(0,120))); page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120));});
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(5000);
for (const k of ['home','movies','tv','af','books','tg','search','catalog']) {
  await page.evaluate(s=>{const el=document.querySelector('[data-nav="'+s+'"]'); if(el)el.click();}, k);
  await page.waitForTimeout(4000);
  const r = await page.evaluate(() => {
    const a = document.querySelector('section.page.active');
    if (!a) return null;
    const rect = a.getBoundingClientRect();
    return { id: a.id, w: Math.round(rect.width), h: Math.round(rect.height), kids: a.children.length, text: (a.innerText||'').slice(0,40).replace(/\s+/g,' ') };
  });
  console.log(k, '=>', JSON.stringify(r));
  await page.screenshot({ path: 'FINAL_fix_' + k + '.png' });
}
console.log('ERRORS:', errs.length?errs.slice(0,6):'NONE');
await browser.close();
