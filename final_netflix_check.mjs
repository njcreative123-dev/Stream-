import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errs=[];
page.on('pageerror',e=>errs.push(e.message.slice(0,140))); page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120));});
await page.goto(URL,{waitUntil:'domcontentloaded'}).catch(()=>{});
await page.waitForTimeout(3500);
await page.screenshot({ path:'FINAL_netflix_home.png' });
for(const k of ['tv','movies','tg','books','af','search','catalog','home']){
  await page.evaluate(s=>{const el=document.querySelector('[data-nav="'+s+'"]'); if(el) el.click();},k);
  await page.waitForTimeout(2200);
  const st=await page.evaluate(()=>{const a=document.querySelector('section.page.active'); return a?a.id+':'+a.children.length:'NONE';});
  console.log(k,'=>',st);
}
console.log('ERRORS:', errs.length?errs.slice(0,6):'NONE');
await browser.close();
