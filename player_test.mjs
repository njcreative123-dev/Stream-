import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
page.on('console', m => { if (m.type()==='error') errs.push('C:' + m.text().slice(0,140)); });
page.on('pageerror', e => errs.push('PE:' + e.message.slice(0,200)));
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(4000);
// go to movies TG tab
await page.evaluate(()=>document.querySelector('[data-nav="movies"]').click());
await page.waitForTimeout(2500);
await page.evaluate(()=>{const t=[...document.querySelectorAll('[data-mtype]')].find(b=>b.getAttribute('data-mtype')==='tg'); if(t) t.click();});
await page.waitForTimeout(8000);
// find + click 243885
const card = await page.evaluate(() => {
  const c = [...document.querySelectorAll('[data-libplay]')].find(x=>x.getAttribute('data-libplay')==='243885');
  if (!c) return null;
  c.click(); return 'clicked';
});
console.log('card:', card);
await page.waitForTimeout(2500);
// check player UI
const ui = await page.evaluate(() => {
  const modal = document.getElementById('videoModal');
  const controls = document.getElementById('vmControls');
  return {
    modalOpen: !modal.classList.contains('hide'),
    hasTHumb: !!document.getElementById('vmThumb'),
    hasPlayOverlay: !!document.getElementById('vmPlayBtn'),
    controlsVisible: controls.classList.contains('show'),
    barWrap: !!document.getElementById('vmBarWrap'),
    pp: !!document.getElementById('vmPP'),
    rw: !!document.getElementById('vmRw'),
    ff: !!document.getElementById('vmFf'),
    mute: !!document.getElementById('vmMute'),
    vol: !!document.getElementById('vmVol'),
    spd: !!document.getElementById('vmSpd'),
    pip: !!document.getElementById('vmPip'),
    fs: !!document.getElementById('vmFs'),
    curTime: !!document.getElementById('vmCur')
  };
});
console.log('PLAYER UI:', JSON.stringify(ui, null, 1));
// click the play overlay
await page.evaluate(()=>{document.getElementById('vmPlayBtn').click();});
await page.waitForTimeout(8000);
const st = await page.evaluate(() => {
  const v = document.getElementById('vmVideo');
  return v ? JSON.stringify({ t: v.currentTime, rs: v.readyState, paused: v.paused, dur: v.duration, err: v.error ? v.error.message : null }) : 'no video';
});
console.log('PLAY STATE:', st);
await page.screenshot({ path: 'NETFLIX_player_playing.png' });
// test speed button
await page.evaluate(()=>{document.getElementById('vmSpd').click();});
const spd = await page.evaluate(() => { const v=document.getElementById('vmVideo'); const b=document.getElementById('vmSpd'); return { rate:v.playbackRate, label:b.textContent }; });
console.log('SPEED:', JSON.stringify(spd));
// test volume
await page.evaluate(()=>{ document.getElementById('vmVol').value='0'; document.getElementById('vmVol').dispatchEvent(new Event('input')); });
const vol = await page.evaluate(() => ({ muted: document.getElementById('vmVideo').muted, volume: document.getElementById('vmVideo').volume }));
console.log('VOLUME:', JSON.stringify(vol));
console.log('ERRORS:', errs.length ? errs : 'NONE');
await browser.close();
