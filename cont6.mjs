import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const out = {}; const errors = [];
const browser = await chromium.launch({ headless: true, executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error' && !/api\/media\/requests/.test(m.text())) errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
const J = ms => page.waitForTimeout(ms);
const clickNav = async nav => {
  try { await page.click(`.nav-btn[data-nav="${nav}"]`, { timeout: 8000 }); } catch { await page.evaluate(n => { const b = document.querySelector(`.nav-btn[data-nav="${n}"]`); if (b) b.click(); }, nav); }
  await J(3500);
};
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await J(4000);

// 1) Mirror playback proof (faststart video via media API)
out.play = await page.evaluate(async () => {
  const v = document.createElement('video');
  v.src = 'https://njsoft-stream.njcreative123.workers.dev/api/media/test-faststart?proxy=1';
  v.muted = true; v.crossOrigin = 'anonymous';
  document.body.appendChild(v);
  v.play().catch(()=>{});
  await new Promise(r => setTimeout(r, 6000));
  const res = { ready: v.readyState, time: Math.round(v.currentTime * 10) / 10, dur: Math.round((v.duration || 0) * 10) / 10, err: v.error ? v.error.message : null };
  v.remove();
  return res;
});

// 2) NJ Room (not logged in) should now show admin-login hint
await clickNav('nj');
await J(3000);
out.njReqsNoLogin = await page.evaluate(() => {
  const el = document.getElementById('njReqs');
  return el ? el.textContent.trim().slice(0, 120) : 'no-el';
});

// 3) Login as admin (admin/admin123 seeded) and check pending requests visible
await page.evaluate(() => { const b = document.querySelector('#loginBtn'); if (b) b.click(); });
await J(1200);
await page.evaluate(() => {
  const u = document.querySelector('#loginUser'), p = document.querySelector('#loginPass');
  const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  s.call(u, 'admin'); u.dispatchEvent(new Event('input', { bubbles: true }));
  s.call(p, 'admin123'); p.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.evaluate(() => { const f = document.querySelector('#loginForm'); if (f) f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit')); });
await J(2500);
out.login = await page.evaluate(() => {
  const pill = document.querySelector('#userPill');
  return pill ? pill.textContent.trim().slice(0, 80) : 'no-pill';
});
await clickNav('nj');
await J(3000);
out.njReqsAdmin = await page.evaluate(() => {
  const el = document.getElementById('njReqs');
  return el ? el.textContent.trim().slice(0, 400) : 'no-el';
});
await page.screenshot({ path: '/root/johnny.heliohost./cont6_nj_admin.png' });

console.log(JSON.stringify({ out, errors: errors.slice(0, 6), errorCount: errors.length }, null, 1));
await browser.close();
