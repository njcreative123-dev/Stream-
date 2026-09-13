import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errs = [];
page.on('console', m => { if (m.type()==='error') errs.push('C:'+m.text().slice(0,120)); });
page.on('pageerror', e => errs.push('PE:'+e.message.slice(0,160)));
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(4000);
await page.evaluate(()=>{const el=document.querySelector('[data-nav="movies"]'); if(el) el.click();});
await page.waitForTimeout(2500);
await page.evaluate(()=>{const t=[...document.querySelectorAll('[data-mtype]')].find(b=>b.getAttribute('data-mtype')==='tg'); if(t) t.click();});
await page.waitForTimeout(8000);
await page.evaluate(()=>{const c=[...document.querySelectorAll('[data-libplay]')].find(x=>x.getAttribute('data-libplay')==='243885'); if(c) c.click();});
await page.waitForTimeout(2000);
await page.evaluate(()=>{const pb=document.getElementById('vmPlayBtn'); if(pb) pb.click();});
await page.waitForTimeout(8000);
const st = await page.evaluate(() => {
  const v=document.getElementById('vmVideo');
  const modal=document.getElementById('videoModal');
  const ctrls=document.getElementById('vmControls');
  return {
    t: v ? v.currentTime : null, rs: v ? v.readyState : null, err: v && v.error ? v.error.message : null,
    fullscreen: !!document.fullscreenElement,
    modalOpen: !modal.classList.contains('hide'),
    controlsShown: ctrls.classList.contains('show'),
    modalRect: (()=>{const r=modal.getBoundingClientRect(); return {w:Math.round(r.width),h:Math.round(r.height)};})()
  };
});
console.log('MOBILE PLAY:', JSON.stringify(st, null, 1));
await page.screenshot({ path: 'NETFLIX_mobile_playing.png' });
// keyboard test: space + arrows on desktop context not possible on mobile; instead verify via key events
console.log('ERRORS:', errs.length ? errs : 'NONE');
await browser.close();
