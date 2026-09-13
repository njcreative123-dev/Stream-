import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
page.on('console', m => { if (m.type()==='error') errs.push('C:' + m.text().slice(0,120)); });
page.on('pageerror', e => errs.push('PE:' + e.message.slice(0,160)));

// Homepage
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(4000);
await page.screenshot({ path: 'BOOST_home_desktop.png' });

// All pages
const pages = ['tv','movies','tg','books','af','search','catalog'];
for (const p of pages) {
  await page.evaluate(s=>{const el=document.querySelector('[data-nav="'+s+'"]'); if(el) el.click();}, p);
  await page.waitForTimeout(2500);
  const st = await page.evaluate(() => {
    const a = document.querySelector('section.page.active');
    return a ? { id: a.id, kids: a.children.length } : null;
  });
  console.log(p, '=>', JSON.stringify(st));
  await page.screenshot({ path: 'BOOST_' + p + '_desktop.png' });
}

// TV playback
await page.evaluate(()=>document.querySelector('[data-nav="tv"]').click());
await page.waitForTimeout(5000);
await page.evaluate(()=>{ const c = document.querySelector('[data-tvplay]'); if(c) c.click(); });
await page.waitForTimeout(8000);
const tv = await page.evaluate(() => {
  const v = document.getElementById('tvVideo');
  return v ? { t: v.currentTime, rs: v.readyState, err: v.error ? v.error.message : null } : null;
});
console.log('TV PLAY:', JSON.stringify(tv));
await page.screenshot({ path: 'BOOST_tv_playing.png' });

// Movie playback
await page.evaluate(()=>document.querySelector('[data-nav="movies"]').click());
await page.waitForTimeout(2500);
await page.evaluate(()=>{const t=[...document.querySelectorAll('[data-mtype]')].find(b=>b.getAttribute('data-mtype')==='tg'); if(t) t.click();});
await page.waitForTimeout(8000);
await page.evaluate(()=>{ const c=[...document.querySelectorAll('[data-libplay]')].find(x=>x.getAttribute('data-libplay')==='243885'); if(c) c.click(); });
await page.waitForTimeout(3000);
await page.evaluate(()=>{ const pb=document.getElementById('vmPlayBtn'); if(pb) pb.click(); });
await page.waitForTimeout(8000);
const mv = await page.evaluate(() => {
  const v = document.getElementById('vmVideo');
  return v ? { t: v.currentTime, rs: v.readyState, err: v.error ? v.error.message : null, title: (document.getElementById('vmTitle')?.textContent || '').slice(0,50) } : null;
});
console.log('MOVIE PLAY:', JSON.stringify(mv));
await page.screenshot({ path: 'BOOST_movie_playing.png' });

// Family chat (fresh after reset)
await page.evaluate(()=>document.querySelector('[data-nav="af"]').click());
await page.waitForTimeout(4000);
const famBtns = await page.evaluate(() => ({
  startBtn: !!document.querySelector('[data-start-fam]'),
  input: !!document.getElementById('famIn'),
  sendBtn: !!document.getElementById('famSend')
}));
console.log('FAM UI:', JSON.stringify(famBtns));
await page.screenshot({ path: 'BOOST_family_chat.png' });

console.log('TOTAL ERRORS:', errs.length);
errs.slice(0,8).forEach(e=>console.log(e));
await browser.close();
