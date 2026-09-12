import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const out = {}; const errors = [];
const browser = await chromium.launch({ headless: true, executablePath: EXE, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') errors.push(m.text() + (m.location ? ' @' + m.location.url : '')); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
const J = ms => page.waitForTimeout(ms);
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await J(7000);

out.state = await page.evaluate(() => {
  const a = window.njAvatars;
  return {
    hasAvatars: !!a,
    scenes: a ? a.scenes.length : -1,
    agents: a ? Object.keys(a.agents).length : -1,
    speakAll: typeof window.njAvatarSpeakAll
  };
});

// speak test
out.speak = await page.evaluate(async () => {
  window.njAvatarSpeakAll(true);
  await new Promise(r => setTimeout(r, 300));
  const sc = (window.njAvatars.scenes || [])[0];
  const res = sc ? { sayT: Math.round(sc.sayT * 100) / 100, mouthY: Math.round(sc.mouth.scale.y * 100) / 100 } : null;
  window.njAvatarSpeakAll(false);
  await new Promise(r => setTimeout(r, 300));
  const sc2 = (window.njAvatars.scenes || [])[0];
  const res2 = sc2 ? { sayT2: Math.round(sc2.sayT * 100) / 100, mouthY2: Math.round(sc2.mouth.scale.y * 100) / 100 } : null;
  return { on: res, off: res2 };
});

// All rooms desktop
const rooms = ['tv','tg','movies','books','search','ai','nj'];
for (const nav of rooms) {
  await page.evaluate(n => { const b = document.querySelector(`.nav-btn[data-nav="${n}"]`); if (b) b.click(); }, nav);
  await J(2600);
  const st = await page.evaluate((nav) => {
    const s = document.querySelector('.agent3d');
    return { nav, canvas: s ? !!s.querySelector('canvas') : false, slotW: s ? s.clientWidth : 0, canvasW: s && s.querySelector('canvas') ? s.querySelector('canvas').width : 0 };
  }, nav);
  out['desk_' + nav] = st;
  try { await page.screenshot({ path: `/root/johnny.heliohost./cont8_desk_${nav}.png` }); } catch(e) { out['shot_' + nav] = e.message.slice(0, 60); }
}

// Mobile viewport test
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await mctx.newPage();
mp.on('console', m => { if (m.type() === 'error') errors.push('M:' + m.text()); });
await mp.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await mp.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await J(7000);
await mp.evaluate(n => { const b = document.querySelector(`.nav-btn[data-nav="${n}"]`); if (b) b.click(); }, 'tv');
await J(3000);
out.mobile = await mp.evaluate(() => {
  const s = document.querySelector('.agent3d');
  const c = s ? s.querySelector('canvas') : null;
  return { visible: s && s.querySelector('canvas') ? true : false, slotW: s ? s.clientWidth : 0, canvasCssW: c ? getComputedStyle(c).width : '', canvasAttrW: c ? c.width : 0 };
});
try { await mp.screenshot({ path: '/root/johnny.heliohost./cont8_mobile_tv.png' }); } catch(e) { out.mobileShot = e.message.slice(0, 60); }
await mctx.close();

console.log(JSON.stringify({ out, errors: errors.slice(0, 8), errorCount: errors.length }, null, 1));
await browser.close();
