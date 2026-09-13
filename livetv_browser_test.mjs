import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
page.on('console', m => { if (m.type()==='error') errs.push(m.text().slice(0,140)); });
page.on('pageerror', e => errs.push('PE: '+e.message.slice(0,140)));
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(4000);
// Go to TV nav
await page.evaluate(() => { const el=document.querySelector('[data-nav="tv"]'); if(el) el.click(); else console.log('no tv nav'); });
await page.waitForTimeout(6000);
// Check channel count and list some Hindi channels
const count = await page.evaluate(() => {
  const cards=[...document.querySelectorAll('[data-tvplay]')];
  return { cards: cards.length, hindi: cards.filter(c=>c.textContent.includes('🇮🇳')).length, first5: cards.slice(0,5).map(c=>c.textContent.trim().slice(0,40)) };
});
console.log('TV grid:', JSON.stringify(count));
// Click Hindi chip
await page.evaluate(() => { const c=[...document.querySelectorAll('[data-tvcat="hindi"]')]; if(c.length) c[0].click(); });
await page.waitForTimeout(1500);
const hindiCards = await page.evaluate(() => [...document.querySelectorAll('[data-tvplay]')].slice(0,10).map(c=>c.textContent.trim().slice(0,45)));
console.log('Hindi channels:', JSON.stringify(hindiCards));
// Play first channel
await page.evaluate(() => { const c=document.querySelector('[data-tvplay]'); if(c) c.click(); });
await page.waitForTimeout(12000);
const st1 = await page.evaluate(() => {
  const v=document.getElementById('tvVideo');
  const st=document.getElementById('tvPlaying');
  return v ? JSON.stringify({t:v.currentTime, rs:v.readyState, paused:v.paused, err:v.error?String(v.error.code):null, status:st?st.textContent:null}) : 'no video el';
});
console.log('CH1 PLAY:', st1);
await page.screenshot({ path: 'LIVETV_ch1_playing.png' });
// Try 3 more channels to check they're not stuck
for (let i=1; i<=3; i++) {
  await page.evaluate(() => { const c=[...document.querySelectorAll('[data-tvplay]')][1]; if(c) c.click(); });
  await page.waitForTimeout(8000);
  const st = await page.evaluate(() => {
    const v=document.getElementById('tvVideo');
    const st2=document.getElementById('tvPlaying');
    return v ? JSON.stringify({t:v.currentTime, rs:v.readyState, err:v.error?String(v.error.code):null, status:st2?st2.textContent:null}) : 'no video el';
  });
  console.log('CH'+(i+1)+' PLAY:', st);
}
console.log('errors:', errs.length ? errs.slice(0,8) : 'NONE');
await browser.close();
