import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
page.on('console', m => { if (m.type()==='error') errs.push(m.text().slice(0,100)); });
page.on('pageerror', e => errs.push('PE: '+e.message.slice(0,120)));
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(4000);
await page.evaluate(() => document.querySelector('[data-nav="movies"]').click());
await page.waitForTimeout(2500);
await page.evaluate(() => { const t=[...document.querySelectorAll('[data-mtype]')].find(b=>b.getAttribute('data-mtype')==='tg'); if(t) t.click(); });
await page.waitForTimeout(9000);
const found = await page.evaluate(() => {
  const c = [...document.querySelectorAll('[data-libplay]')].find(x => x.getAttribute('data-libplay') === '243885');
  return c ? { libt: c.getAttribute('data-libt'), dl: !!c.parentElement.querySelector('[data-libdl]') } : null;
});
console.log('243885 card:', JSON.stringify(found));
if (found) {
  await page.evaluate(() => { const c=[...document.querySelectorAll('[data-libplay]')].find(x=>x.getAttribute('data-libplay')==='243885'); c.click(); });
  await page.waitForTimeout(3500);
  await page.evaluate(() => { const pb=document.getElementById('vmPlayBtn'); if(pb) pb.click(); });
  await page.waitForTimeout(10000);
  const st = await page.evaluate(() => { const v=document.getElementById('vmVideo'); return v ? JSON.stringify({t:v.currentTime, rs:v.readyState, err:v.error?v.error.message:null, title:document.getElementById('vmTitle').textContent}) : 'no el'; });
  console.log('PLAY:', st);
  await page.screenshot({ path: 'FINAL_dhamaal_243885_playing.png' });
} else {
  console.log('243885 card NOT in tab — checking library API directly');
  const d = await page.evaluate(async () => (await fetch('https://njsoft-stream.njcreative123.workers.dev/api/telegram/library?cat=videos&limit=200&q=dhamaal', {cache:'no-store'})).json());
  console.log('q=dhamaal items:', (d.items||[]).map(i => i.id + ':' + (i.mirror ? 'M' : '-')).slice(0,10));
}
console.log('errors:', errs.length ? errs : 'NONE');
await browser.close();
