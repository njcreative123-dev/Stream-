import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const out = {}; const errors = [];
const browser = await chromium.launch({ headless: true, executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
const J = ms => page.waitForTimeout(ms);
const clickNav = async nav => {
  try { await page.click(`.nav-btn[data-nav="${nav}"]`, { timeout: 8000 }); } catch { await page.evaluate(n => { const b = document.querySelector(`.nav-btn[data-nav="${n}"]`); if (b) b.click(); }, nav); }
  await J(3500);
};
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await J(4000);

// TG page: site-stream states
await clickNav('tg');
await J(6000);
out.tg = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.site-stream')];
  const ready = rows.filter(r => r.classList.contains('ready')).length;
  const missing = rows.filter(r => r.classList.contains('missing')).length;
  const reqBtns = [...document.querySelectorAll('[data-mirror-request]')].filter(b => b.style.display !== 'none').length;
  const status = rows.slice(0, 3).map(r => (r.querySelector('.ss-status')||{}).textContent);
  return { rows: rows.length, ready, missing, reqBtnsVisible: reqBtns, status };
});

// click first mirror request button
const reqClick = await page.evaluate(async () => {
  const b = [...document.querySelectorAll('[data-mirror-request]')].find(x => x.style.display !== 'none');
  if (!b) return { clicked: false };
  b.click();
  await new Promise(r => setTimeout(r, 3500));
  return { clicked: true, text: b.textContent.trim() };
});
out.reqClick = reqClick;
await page.screenshot({ path: '/root/johnny.heliohost./cont5_tg_req.png' });

// NJ Room: pending requests list
await clickNav('nj');
await J(3500);
out.njReqs = await page.evaluate(() => {
  const el = document.getElementById('njReqs');
  if (!el) return { err: 'no #njReqs' };
  const rows = [...el.querySelectorAll('div')].filter(d => d.textContent.includes('TG Link'));
  return { html: el.textContent.trim().slice(0, 300), rows: rows.length, has243919: el.textContent.includes('243919') };
});
await page.screenshot({ path: '/root/johnny.heliohost./cont5_nj_reqs.png' });

// Direct play proof for registered mirror test-longview
out.streamPlay = await page.evaluate(async () => {
  const v = document.createElement('video');
  v.src = 'https://njsoft-stream.njcreative123.workers.dev/api/media/test-longview?proxy=1';
  v.muted = true;
  document.body.appendChild(v);
  v.play().catch(()=>{});
  await new Promise(r => setTimeout(r, 8000));
  const res = { ready: v.readyState, time: Math.round(v.currentTime * 10) / 10, dur: Math.round((v.duration||0) * 10) / 10, err: v.error ? v.error.message : null };
  v.remove();
  return res;
});

console.log(JSON.stringify({ out, errors: errors.slice(0, 6), errorCount: errors.length }, null, 1));
await browser.close();
